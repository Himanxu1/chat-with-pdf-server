import rateLimit from 'express-rate-limit'
import logger from '../utils/logger.js'

/**
 * Rate limiter specifically for password change attempts
 * More restrictive than general API rate limiting
 */
export const passwordChangeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 password change attempts per windowMs
  message: {
    error: 'Too many password change attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password change rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      error: 'Too many password change attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    })
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development'
  }
})

/**
 * Rate limiter for profile update attempts
 */
export const profileUpdateRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 profile updates per windowMs
  message: {
    error: 'Too many profile update attempts. Please try again in 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Profile update rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      error: 'Too many profile update attempts. Please try again in 5 minutes.',
      retryAfter: '5 minutes'
    })
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development'
  }
})


