import { z } from "zod";

export const chatSchema = z.object({
  body: z.object({
    question: z.string(),
    chatId: z.string().uuid(), // Add chatId validation
  }),
});

export const uploadPdfSchema = z.object({
  body: z.object({
    chatId: z.string().uuid(), // Add chatId validation
  }),
});

export const createChatSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    pdfId: z.string().uuid().optional().nullable(),
  }),
});

export const getChatByUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const getMessagesByChatIdSchema = z.object({
  params: z.object({
    chatId: z.string().uuid(),
  }),
});
