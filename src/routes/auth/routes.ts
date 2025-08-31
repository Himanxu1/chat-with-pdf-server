import { Router } from "express";
import AuthControllerService from "./auth.controller.js";
import { loginSchema, registerSchema } from "./contract.js";
import { validateRequest } from "../../middleware/validation.js";

const router = Router();

router.get("/hello", (_, res) => {
  res.send("Hello from Auth!");
});

router.post(
  "/login",
  validateRequest(loginSchema),
  AuthControllerService.login
);
router.post(
  "/register",
  validateRequest(registerSchema),
  AuthControllerService.register
);

router.get("/logout", AuthControllerService.logout);

export default router;
