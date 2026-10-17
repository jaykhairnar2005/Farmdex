import { Router } from 'express';
import {
  getOrCreateConversationController,
  getUserConversationsController,
  getConversationMessagesController,
  sendMessageController,
  markConversationAsReadController,
} from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all chat endpoints with JWT Authentication
router.use(authenticateToken);

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/', getUserConversationsController);

/**
 * @route   POST /api/conversations
 * @desc    Get or create a conversation with a recipient
 * @access  Private
 */
router.post('/', getOrCreateConversationController);

/**
 * @route   GET /api/conversations/:id
 * @route   GET /api/conversations/:id/messages
 * @desc    Get conversation details and paginated message history
 * @access  Private (Participant only)
 */
router.get('/:id', getConversationMessagesController);
router.get('/:id/messages', getConversationMessagesController);

/**
 * @route   POST /api/conversations/:id/messages
 * @desc    Send a message in a conversation
 * @access  Private (Participant only)
 */
router.post('/:id/messages', sendMessageController);

/**
 * @route   PATCH /api/conversations/:id/read
 * @desc    Mark conversation messages as read
 * @access  Private (Participant only)
 */
router.patch('/:id/read', markConversationAsReadController);

export default router;
