import { Router } from 'express'
import AnalyticsControllerService from './analytics.controller.js'
import { authenticateToken } from '../../middleware/authenticateToken.js'
import { apiRateLimiter } from '../../middleware/rateLimiter.js'

const router = Router()

// All analytics routes require authentication
router.use(authenticateToken)

// Core analytics endpoints
router.get(
  '/usage',
  apiRateLimiter,
  AnalyticsControllerService.getUsageAnalytics,
)

router.get(
  '/documents',
  apiRateLimiter,
  AnalyticsControllerService.getDocumentAnalytics,
)

router.get(
  '/chats',
  apiRateLimiter,
  AnalyticsControllerService.getChatAnalytics,
)

// Extended analytics endpoints
router.get(
  '/performance',
  apiRateLimiter,
  AnalyticsControllerService.getPerformanceAnalytics,
)

router.get(
  '/business',
  apiRateLimiter,
  AnalyticsControllerService.getBusinessAnalytics,
)

// Export analytics data
router.get(
  '/export',
  apiRateLimiter,
  AnalyticsControllerService.exportAnalytics,
)

export default router
