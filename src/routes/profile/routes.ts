import { Router } from 'express'
import ProfileControllerService from './profile.controller.js'
import { authenticateToken } from '../../middleware/authenticateToken.js'
import { apiRateLimiter } from '../../middleware/rateLimiter.js'
import { passwordChangeRateLimit, profileUpdateRateLimit } from '../../middleware/passwordChangeRateLimit.js'

const router = Router()

// All profile routes require authentication
router.use(authenticateToken)

// Get user profile
router.get(
  '/',
  apiRateLimiter,
  ProfileControllerService.getUserProfile,
)

// Update profile
router.put(
  '/',
  profileUpdateRateLimit,
  ProfileControllerService.updateProfile,
)

// Update password
router.put(
  '/password',
  passwordChangeRateLimit,
  ProfileControllerService.updatePassword,
)

export default router
