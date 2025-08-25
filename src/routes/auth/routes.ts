import { Router } from "express";
import AuthControllerService from "./auth.controller.js";

const router = Router();

router.post("/login", AuthControllerService.login);
router.post("/register", AuthControllerService.register);

export default router;
