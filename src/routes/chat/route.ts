import { Router } from "express";
import ChatControllerService from "./chat.controller.js";
import { validateRequest } from "../../middleware/validation.js";
import {
  apiRateLimiter,
  uploadRateLimiter,
} from "../../middleware/rateLimiter.js";
import multer from "multer";
import path from "path";
import { chatSchema, uploadPdfSchema } from "./contract.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const upload = multer({ storage });

const router = Router();

router.post(
  "/",
  apiRateLimiter,
  validateRequest(chatSchema),
  ChatControllerService.uploadChatToVector
);

router.post(
  "/pdf",
  uploadRateLimiter,
  upload.single("pdf"),
  // validateRequest(uploadPdfSchema),
  ChatControllerService.uploadPdftoQueue
);

export default router;
