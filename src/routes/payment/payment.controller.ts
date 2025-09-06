import logger from '../../utils/logger.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { subscriptionRepository } from '../../typeorm/repository/subscription.repository.js'
import { planRepository } from '../../typeorm/repository/plan.repository.js'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
})

export class PaymentController {
  public static instance: PaymentController

  static getInstance() {
    if (!PaymentController.instance) {
      PaymentController.instance = new PaymentController()
    }
    return PaymentController.instance
  }
  public createPayment = async (req: any, res: any) => {
    try {
      const { amount } = req.body

      const options = {
        amount: amount * 100, // amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      }

      const order = await razorpay.orders.create(options)
      res.json(order)
    } catch (err) {
      logger.error(err)
      throw new Error('Error creating order')
    }
  }

  public verifySignature = async (req: any, res: any) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body

      const sign = razorpay_order_id + '|' + razorpay_payment_id
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET!)
        .update(sign.toString())
        .digest('hex')

      if (razorpay_signature === expectedSign) {
        res.json({ success: true, message: 'Payment verified successfully' })
      } else {
        res.json({ success: false, message: 'Invalid signature' })
      }
    } catch (err) {
      logger.error(err)
    }
  }

  public createPlan = async (req: any, res: any) => {
    try {
      const plans = [
        { name: 'Free', price: 0 },
        { name: 'Basic', price: 150000, interval: 'monthly' }, // ₹1500 * 100
        { name: 'Pro', price: 300000, interval: 'monthly' }, // ₹3000 * 100
      ]

      for (const p of plans) {
        let razorpayPlanId: string | null = null

        if (p.price > 0) {
          const plan = await razorpay.plans.create({
            period: 'monthly',
            interval: 1,
            item: { name: p.name, amount: p.price, currency: 'INR' },
          })
          razorpayPlanId = plan.id
        }

        await planRepository.save(
          planRepository.create({ ...p, razorpayPlanId }),
        )
      }

      res.json({ ok: true })
    } catch (error) {
      logger.error(`${JSON.stringify(error)}`)
      throw new Error('Error creating Plan', error)
    }
  }

  public createSubscription = async (req: any, res: any) => {
    try {
      const userId = req.user.id
      const { tier } = req.body

      const plan = await planRepository.findOne({ where: { name: tier } })
      if (!plan) return res.status(400).json({ error: 'Invalid plan' })

      let sub
      if (plan.price === 0) {
        // Free plan: just store in DB
        sub = subscriptionRepository.create({
          user: { id: userId },
          plan,
          status: 'active',
        })
        await subscriptionRepository.save(sub)
        return res.json({ ok: true, subscription: sub })
      }

      // Paid plan: create Razorpay subscription
      const razorpaySub = await razorpay.subscriptions.create({
        plan_id: plan.razorpayPlanId,
        total_count: 12, // 12 cycles
        customer_notify: true,
        notes: { userId },
      })

      sub = subscriptionRepository.create({
        user: { id: userId },
        plan,
        razorpaySubscriptionId: razorpaySub.id,
        status: 'created',
      })
      await subscriptionRepository.save(sub)

      res.json({
        key: process.env.RZP_KEY_ID,
        subscription_id: razorpaySub.id,
      })
    } catch (error) {
      logger.error(error)
      throw new Error('Error creating Subscription', error)
    }
  }

  public verifySubscription = async (req: any, res: any) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      } = req.body

      const hmac = crypto
        .createHmac('sha256', process.env.RZP_KEY_SECRET)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest('hex')

      if (hmac !== razorpay_signature) {
        return res.status(400).json({ ok: false, error: 'Signature mismatch' })
      }

      await subscriptionRepository.update(
        { razorpaySubscriptionId: razorpay_subscription_id },
        { status: 'authenticated' },
      )

      res.json({ ok: true })
    } catch (error) {
      logger.error(error)
      throw new Error('Error verifying subscription', error)
    }
  }

  public getUserSubscriptionStatus = async (req: any, res: any) => {
    try {
      const userId = req.user.id
      const sub = await subscriptionRepository.findOne({
        where: { user: { id: userId }, status: 'active' },
        relations: ['plan'],
      })

      res.json({ subscription: sub })
    } catch (error) {
      logger.error(error)
      throw new Error('Error getting user subscription status', error)
    }
  }

  public cancelUserSubscription = async (req: any, res: any) => {
    try {
      const userId = req.user.id
      const sub = await subscriptionRepository.findOne({
        where: { user: { id: userId }, status: 'active' },
      })
      if (!sub) return res.status(400).json({ error: 'No active subscription' })

      if (sub.razorpaySubscriptionId) {
        await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId, true)
      }

      await subscriptionRepository.update(
        { id: sub.id },
        { status: 'cancelled' },
      )
      res.json({ ok: true })
    } catch (error) {
      logger.error(error)
      throw new Error('Error cancelling user subscription', error)
    }
  }
}

const PaymentControllerService = PaymentController.getInstance()

export default PaymentControllerService
