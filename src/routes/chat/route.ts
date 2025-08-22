import { Router } from "express";
import { upload } from "../../config/storage.js";
import { registerPdfQueueEventHandlers } from "../../events/pdf.events.js";
import ChatControllerService from "./chat.controller.js";
const router = Router();

router.post(
  "/pdf/upload",
  upload.single("pdf"),
  ChatControllerService.uploadChatToVector
);

router.post("/chat", ChatControllerService.uploadPdftoQueue);

export default router;
