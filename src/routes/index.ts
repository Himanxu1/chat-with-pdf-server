import { Router } from 'express'
import chatRouter from './chat/routes.js'
import websiteRouter from './website/routes.js'
import authRouter from './auth/routes.js'
import paymentRouter from './payment/routes.js'
import { authenticateToken } from '../middleware/authenticateToken.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/chat', authenticateToken, chatRouter)
router.use('/website', websiteRouter)
router.use('/payment', paymentRouter)

export default router
