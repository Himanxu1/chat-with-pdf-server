import { Router } from 'express'
import WebhookControllerService from './webhook.controller.js'

const router = Router()

router.post('/razorpay', WebhookControllerService.SubscriptionHandler)

export default router
