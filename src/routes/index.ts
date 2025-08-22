import { Router } from "express";
import chatRouter from "./chat/route.js";
const router = Router();

router.use("/chat", chatRouter);

export default router;
