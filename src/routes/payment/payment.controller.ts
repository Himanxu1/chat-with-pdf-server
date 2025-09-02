import logger from "../../utils/logger.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export class PaymentController {
  public static instance: PaymentController;

  static getInstance() {
    if (!PaymentController.instance) {
      PaymentController.instance = new PaymentController();
    }
    return PaymentController.instance;
  }
  public createPayment = async (req: any, res: any) => {
    try {
      const { amount } = req.body;

      const options = {
        amount: amount * 100, // amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (err) {
      logger.error(err);
      throw new Error("Error creating order");
    }
  };

  public verifySignature = async (req: any, res: any) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.json({ success: false, message: "Invalid signature" });
      }
    } catch (err) {
      logger.error(err);
    }
  };
}

const PaymentControllerService = PaymentController.getInstance();

export default PaymentControllerService;
