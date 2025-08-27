import { Router } from "express";
import WebsiteChatControllerService from "./website.controller.js";
import { validateRequest } from "../../middleware/validation.js";
import { websiteChatSchema, websiteUploadSchema } from "./contract.js";

const router = Router();

router.post(
  "/",
  validateRequest(websiteUploadSchema),
  WebsiteChatControllerService.uploadWebsiteLink
);
router.post(
  "/chat",
  validateRequest(websiteChatSchema),
  WebsiteChatControllerService.chatWithWebsite
);

export default router;
