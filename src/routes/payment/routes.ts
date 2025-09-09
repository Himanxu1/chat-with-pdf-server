import { Router } from 'express'
import PaymentControllerService from './payment.controller.js'

const router = Router()

router.post('/create-order', PaymentControllerService.createPayment)
router.post('/verify-payment', PaymentControllerService.verifySignature)

router.get('/create-plans', PaymentControllerService.createPlan)

router.post('/subscription-start', PaymentControllerService.createSubscription)

router.post('/subscription-verify', PaymentControllerService.verifySubscription)

router.get(
  '/subscription-status',
  PaymentControllerService.getUserSubscriptionStatus,
)

router.post(
  '/subscription-cancel',
  PaymentControllerService.cancelUserSubscription,
)

export default router
