import prisma from '../config/db.js';
import { emitToConversation, emitToUser } from '../socket/index.js';
import { createNotificationService } from './notification.service.js';

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Find or create a direct conversation between two users
 */
export async function getOrCreateConversationService(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) {
    throw new AppError('Cannot create a conversation with yourself', 400);
  }

  // Verify target user exists and is active
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      farmerProfile: { select: { farmName: true, district: true, state: true } },
      buyerProfile: { select: { businessName: true, businessType: true } },
    },
  });

  if (!targetUser || !targetUser.isActive) {
    throw new AppError('Recipient user not found or account is inactive', 404);
  }

  // Check if conversation already exists with both participants
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: currentUserId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              farmerProfile: { select: { farmName: true, district: true, state: true } },
              buyerProfile: { select: { businessName: true, businessType: true } },
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (existingConversation) {
    const otherParticipant = existingConversation.participants.find(
      (p) => p.userId !== currentUserId
    )?.user;

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: existingConversation.id,
        senderId: { not: currentUserId },
        isRead: false,
      },
    });

    return {
      ...existingConversation,
      otherParticipant,
      unreadCount,
    };
  }

  // Create new conversation with atomic transaction
  const newConversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUserId },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                farmerProfile: { select: { farmName: true, district: true, state: true } },
                buyerProfile: { select: { businessName: true, businessType: true } },
              },
            },
          },
        },
      },
    });
    return conv;
  });

  const otherParticipant = newConversation.participants.find(
    (p) => p.userId !== currentUserId
  )?.user;

  return {
    ...newConversation,
    otherParticipant,
    unreadCount: 0,
    messages: [],
  };
}

/**
 * Get all conversations for the authenticated user with metadata & unread counts
 */
export async function getUserConversationsService(currentUserId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: currentUserId },
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              farmerProfile: { select: { farmName: true, district: true, state: true } },
              buyerProfile: { select: { businessName: true, businessType: true } },
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Calculate unread count for each conversation
  const conversationsWithMeta = await Promise.all(
    conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== currentUserId
      )?.user;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: currentUserId },
          isRead: false,
        },
      });

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherParticipant,
        lastMessage: conv.messages[0] || null,
        unreadCount,
      };
    })
  );

  return conversationsWithMeta;
}

/**
 * Get messages of a conversation (with strict participant authorization)
 */
export async function getConversationMessagesService(currentUserId, conversationId, { page = 1, limit = 50 } = {}) {
  // Authorization check: User must be a registered participant
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!isParticipant) {
    throw new AppError('Access denied: You are not a participant in this conversation', 403);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              farmerProfile: { select: { farmName: true, district: true, state: true } },
              buyerProfile: { select: { businessName: true, businessType: true } },
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  // Auto mark incoming messages as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  // Emit read event to conversation room
  emitToConversation(conversationId, 'messages:read', {
    conversationId,
    readBy: currentUserId,
  });

  const skip = (page - 1) * limit;
  const [totalCount, messages] = await Promise.all([
    prisma.message.count({ where: { conversationId } }),
    prisma.message.findMany({
      where: { conversationId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUserId
  )?.user;

  return {
    conversationId,
    otherParticipant,
    messages,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Send a message in a conversation (with authorization and real-time alerts)
 */
export async function sendMessageService(currentUserId, conversationId, { content }) {
  // Authorization check: User must be a registered participant
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!isParticipant) {
    throw new AppError('Access denied: You are not a participant in this conversation', 403);
  }

  const trimmedContent = content.trim();

  // Create message and touch conversation updatedAt
  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: currentUserId,
        content: trimmedContent,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  });

  // Find recipient participant(s)
  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: {
      conversationId,
      userId: { not: currentUserId },
    },
  });

  // 1. Emit to active conversation room
  emitToConversation(conversationId, 'message:new', message);

  // 2. Emit alert & create notification for recipient(s)
  for (const part of otherParticipants) {
    emitToUser(part.userId, 'message:received', {
      conversationId,
      message,
    });

    // Create persistent notification for new message
    createNotificationService({
      userId: part.userId,
      type: 'NEW_MESSAGE',
      title: `Message from ${message.sender.name}`,
      message: trimmedContent.length > 80 ? `${trimmedContent.slice(0, 80)}...` : trimmedContent,
    }).catch(() => {});
  }

  return message;
}

/**
 * Mark messages in a conversation as read
 */
export async function markConversationAsReadService(currentUserId, conversationId) {
  const isParticipant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!isParticipant) {
    throw new AppError('Access denied: You are not a participant in this conversation', 403);
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  emitToConversation(conversationId, 'messages:read', {
    conversationId,
    readBy: currentUserId,
  });

  return { success: true, message: 'Conversation marked as read' };
}
