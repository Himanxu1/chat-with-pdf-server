import { Router } from 'express'
import ChatControllerService from './chat.controller.js'
import {
  apiRateLimiter,
  uploadRateLimiter,
} from '../../middleware/rateLimiter.js'
import multer from 'multer'
import path from 'path'
import { checkChatLimit } from '../../middleware/checkChatLimit.js'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // unique filename
  },
})

const upload = multer({ storage })

const router = Router()

router.post(
  '/new',
  apiRateLimiter,
  checkChatLimit,
  // validateRequest(createChatSchema),
  ChatControllerService.createChat,
)

router.get(
  '/user/:userId',
  apiRateLimiter,
  // validateRequest(getChatByUserSchema), // Add validation for getChatByUserSchema
  ChatControllerService.getChatsByUserId,
)

router.get(
  '/:chatId/messages',
  apiRateLimiter,
  // validateRequest(getMessagesByChatIdSchema), // Add validation for getMessagesByChatIdSchema
  ChatControllerService.getMessagesByChatId,
)

router.post(
  '/',
  apiRateLimiter,
  checkChatLimit,
  // validateRequest(chatSchema),
  ChatControllerService.uploadChatToVector,
)

router.post(
  '/pdf',
  uploadRateLimiter,
  upload.single('pdf'),
  checkChatLimit,
  // validateRequest(uploadPdfSchema), // Add validation for uploadPdfSchema
  ChatControllerService.uploadPdftoQueue,
)

export default router
