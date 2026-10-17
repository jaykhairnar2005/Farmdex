import { verifyAccessToken } from '../utils/token.util.js';
import prisma from '../config/db.js';

let ioInstance = null;

/**
 * Initialize Socket.IO Authentication & Event Handlers
 */
export function initSocketServer(io) {
  ioInstance = io;

  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error('Authentication token missing'));
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (err) {
        return next(new Error('Invalid or expired authentication token'));
      }

      // Verify active user in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User account is inactive or not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Internal server error during socket authentication'));
    }
  });

  // Socket Connection Listener
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;

    // Join personal notification & alert room
    socket.join(`user:${userId}`);
    console.log(`[Socket.IO] Authenticated connection: User ${socket.user.name} (${userRole}) [Socket ${socket.id}]`);

    // Join a specific conversation room after verifying participation
    socket.on('conversation:join', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) {
          if (callback) callback({ success: false, message: 'conversationId is required' });
          return;
        }

        // Verify user is a participant of this conversation
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (!participant) {
          if (callback) callback({ success: false, message: 'Access denied: Not a participant' });
          socket.emit('error', { message: 'Access denied: You are not a participant in this conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Leave a conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Typing Indicators
    socket.on('typing:start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:user', {
          conversationId,
          userId,
          name: socket.user.name,
        });
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: User ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
}

/**
 * Emit event to a specific user's private socket room
 */
export function emitToUser(userId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
}

/**
 * Emit event to all sockets currently joined to a conversation room
 */
export function emitToConversation(conversationId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`conversation:${conversationId}`).emit(event, payload);
  }
}

/**
 * Get active io instance
 */
export function getIo() {
  return ioInstance;
}
