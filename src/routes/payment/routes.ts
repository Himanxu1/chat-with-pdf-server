import { Router } from "express";
import PaymentControllerService from "./payment.controller.js";

const router = Router();

router.post("/create-order", PaymentControllerService.createPayment);
router.post("/verify-payment", PaymentControllerService.verifySignature);

export default router;
