import { Router } from "express";
import ChatControllerService from "./chat.controller.js";
import { validateRequest, chatSchema } from "../../middleware/validation.js";
import {
  apiRateLimiter,
  uploadRateLimiter,
} from "../../middleware/rateLimiter.js";
import { uploadToGCP } from "../../config/storage.js";

const router = Router();

router.post(
  "/chat",
  apiRateLimiter,
  validateRequest(chatSchema),
  ChatControllerService.uploadChatToVector
);

router.post(
  "/pdf/upload",
  uploadRateLimiter,
  uploadToGCP,
  ChatControllerService.uploadPdftoQueue
);

export default router;
