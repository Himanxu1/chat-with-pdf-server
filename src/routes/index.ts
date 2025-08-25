import { Router } from "express";
import chatRouter from "./chat/route.js";
import websiteRouter from "./website/routes.js";

const router = Router();

router.use("/chat", chatRouter);
router.use("/website", websiteRouter);

export default router;
