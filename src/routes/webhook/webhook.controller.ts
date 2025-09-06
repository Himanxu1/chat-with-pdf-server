import { subscriptionRepository } from '../../typeorm/repository/subscription.repository.js'
import { webhookRepository } from '../../typeorm/repository/webhook.repository.js'
import logger from '../../utils/logger.js'
import crypto from 'crypto'
class WebhookController {
  public static instance: WebhookController

  static getInstance() {
    if (!WebhookController.instance) {
      WebhookController.instance = new WebhookController()
    }
    return WebhookController.instance
  }

  public SubscriptionHandler = async (req: any, res: any) => {
    try {
      const signature = req.headers['x-razorpay-signature']
      const body = req.rawBody

      const hmac = crypto
        .createHmac('sha256', process.env.RZP_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (hmac !== signature) return res.status(401).send('Invalid signature')

      const event = req.body.event
      const payload = req.body.payload

      await webhookRepository.save({ event, payload })

      switch (event) {
        case 'subscription.activated':
          await subscriptionRepository.update(
            { razorpaySubscriptionId: payload.subscription.entity.id },
            {
              status: 'active',
              currentStart: payload.subscription.entity.current_start,
              currentEnd: payload.subscription.entity.current_end,
            },
          )
          break

        case 'invoice.paid':
        case 'subscription.charged':
          await subscriptionRepository.update(
            { razorpaySubscriptionId: payload.subscription.entity.id },
            {
              currentStart: payload.subscription.entity.current_start,
              currentEnd: payload.subscription.entity.current_end,
            },
          )
          break

        case 'subscription.cancelled':
        case 'subscription.paused':
          await subscriptionRepository.update(
            { razorpaySubscriptionId: payload.subscription.entity.id },
            { status: event.split('.')[1] },
          )
          break
      }

      res.json({ ok: true })
    } catch (error) {
      logger.error(error)
      throw new Error('WEBHOOK ERROR')
    }
  }
}

const WebhookControllerService = WebhookController.getInstance()

export default WebhookControllerService
