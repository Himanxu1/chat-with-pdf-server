import { subscriptionRepository } from '../typeorm/repository/subscription.repository.js'
import { usageRepository } from '../typeorm/repository/usage.repository.js'
import { PLAN_LIMITS } from '../utils/pdfLimits.js'
import type { SubscriptionTier } from '../utils/pdfLimits.js'

export const checkChatLimit = async (req, res, next) => {
  try {
    const userId = req.user.id

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

    // For chat limits, we'll use a simplified approach based on daily PDF limits
    // You can adjust this logic based on your specific chat requirements
    let usage = await usageRepository.findOne({
      where: { user: { id: userId } },
    })

    const today = new Date()
    const todayDate = today.toISOString().split('T')[0]

    if (!usage) {
      usage = usageRepository.create({
        user: { id: userId },
        dailyCount: 0,
        monthlyCount: 0,
        lastResetDay: new Date(todayDate),
        lastResetMonth: new Date(todayDate),
      })
    }

    const lastReset =
      usage.lastResetDay instanceof Date
        ? usage.lastResetDay.toISOString().split('T')[0]
        : String(usage.lastResetDay)

    if (lastReset !== todayDate) {
      usage.dailyCount = 0
      usage.lastResetDay = new Date(todayDate)
    }

    // Use daily PDF limit as chat limit for simplicity
    // You can create separate chat limits if needed
    if (usage.dailyCount >= limits.dailyPdfLimit) {
      return res
        .status(403)
        .json({ message: `Daily limit reached (${limits.dailyPdfLimit} chats per day for ${planName} plan).` })
    }

    usage.dailyCount += 1
    await usageRepository.save(usage)

    next()
  } catch (error) {
    console.error('Error checking chat limit:', error)
    return res.status(500).json({ message: 'Internal server error.' })
  }
}
