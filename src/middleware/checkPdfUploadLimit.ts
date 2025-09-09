import { subscriptionRepository } from '../typeorm/repository/subscription.repository.js'
import { usageRepository } from '../typeorm/repository/usage.repository.js'
import { PLAN_LIMITS } from '../utils/pdfLimits.js'
import type { SubscriptionTier } from '../utils/pdfLimits.js'

export const checkPdfUploadLimit = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Get user's active subscription
    const subscription = await subscriptionRepository.findOne({
      where: { user: { id: userId }, status: 'active' },
      relations: ['plan'],
    })

    if (!subscription) {
      return res.status(403).json({ message: 'No active subscription found.' })
    }

    const planName = subscription.plan.name as SubscriptionTier
    const limits = PLAN_LIMITS[planName]

    if (!limits) {
      return res.status(500).json({ message: 'Invalid subscription plan.' })
    }

    // Check file size limit
    if (req.file) {
      const fileSizeInMB = req.file.size / (1024 * 1024)
      if (fileSizeInMB > limits.maxFileSizeMb) {
        return res.status(413).json({ 
          message: `File size exceeds limit. Maximum allowed: ${limits.maxFileSizeMb}MB for ${planName} plan.` 
        })
      }
    }

    // Get or create usage record
    let usage = await usageRepository.findOne({
      where: { user: { id: userId } },
    })

    const today = new Date()
    const todayDate = today.toISOString().split('T')[0]
    const currentMonth = today.toISOString().substring(0, 7) // YYYY-MM

    if (!usage) {
      usage = usageRepository.create({
        user: { id: userId },
        dailyCount: 0,
        monthlyCount: 0,
        lastResetDay: new Date(todayDate),
        lastResetMonth: new Date(todayDate),
      })
    }

    // Reset daily count if needed
    const lastResetDay = usage.lastResetDay instanceof Date
      ? usage.lastResetDay.toISOString().split('T')[0]
      : String(usage.lastResetDay)

    if (lastResetDay !== todayDate) {
      usage.dailyCount = 0
      usage.lastResetDay = new Date(todayDate)
    }

    // Reset monthly count if needed
    const lastResetMonth = usage.lastResetMonth instanceof Date
      ? usage.lastResetMonth.toISOString().substring(0, 7)
      : String(usage.lastResetMonth).substring(0, 7)

    if (lastResetMonth !== currentMonth) {
      usage.monthlyCount = 0
      usage.lastResetMonth = new Date(todayDate)
    }

    // Check daily limit
    if (usage.dailyCount >= limits.dailyPdfLimit) {
      return res.status(403).json({ 
        message: `Daily PDF upload limit reached (${limits.dailyPdfLimit} PDFs per day for ${planName} plan).` 
      })
    }

    // Check monthly limit (skip if unlimited)
    if (limits.monthlyPdfLimit !== -1 && usage.monthlyCount >= limits.monthlyPdfLimit) {
      return res.status(403).json({ 
        message: `Monthly PDF upload limit reached (${limits.monthlyPdfLimit} PDFs per month for ${planName} plan).` 
      })
    }

    // Increment counters
    usage.dailyCount += 1
    usage.monthlyCount += 1
    await usageRepository.save(usage)

    // Add usage info to request for potential use in controllers
    req.usageInfo = {
      dailyCount: usage.dailyCount,
      monthlyCount: usage.monthlyCount,
      dailyLimit: limits.dailyPdfLimit,
      monthlyLimit: limits.monthlyPdfLimit,
      planName,
    }

    next()
  } catch (error) {
    console.error('Error checking PDF upload limit:', error)
    return res.status(500).json({ message: 'Internal server error.' })
  }
}
