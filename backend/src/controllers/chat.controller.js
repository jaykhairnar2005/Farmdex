import {
  getOrCreateConversationService,
  getUserConversationsService,
  getConversationMessagesService,
  sendMessageService,
  markConversationAsReadService,
} from '../services/chat.service.js';
import { startConversationSchema, sendMessageSchema } from '../validators/chat.validator.js';

export async function getOrCreateConversationController(req, res, next) {
  try {
    const parseResult = startConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid conversation payload',
      });
    }

    const conversation = await getOrCreateConversationService(
      req.user.id,
      parseResult.data.recipientId
    );

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserConversationsController(req, res, next) {
  try {
    const conversations = await getUserConversationsService(req.user.id);
    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversationMessagesController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    const result = await getConversationMessagesService(
      req.user.id,
      req.params.id,
      { page, limit }
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessageController(req, res, next) {
  try {
    const parseResult = sendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid message content',
      });
    }

    const message = await sendMessageService(
      req.user.id,
      req.params.id,
      parseResult.data
    );

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

export async function markConversationAsReadController(req, res, next) {
  try {
    const result = await markConversationAsReadService(
      req.user.id,
      req.params.id
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
