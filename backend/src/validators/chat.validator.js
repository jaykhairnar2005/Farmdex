import { z } from 'zod';

export const startConversationSchema = z.object({
  recipientId: z.string().uuid({ message: 'Valid recipient user ID is required' }),
});

export const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
});
