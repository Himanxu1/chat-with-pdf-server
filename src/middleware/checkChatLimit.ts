import { subscriptionRepository } from '../typeorm/repository/subscription.repository.js'
import { usageRepository } from '../typeorm/repository/usage.repository.js'

export const checkChatLimit = async (req, res, next) => {
  const userId = req.user.id

  const subscription = await subscriptionRepository.findOne({
    where: { user: { id: userId }, status: 'active' },
    relations: ['plan'],
  })

  if (!subscription) {
    return res.status(403).json({ message: 'No active subscription found.' })
  }

  if (subscription.plan.name === 'Free') {
    let usage = await usageRepository.findOne({
      where: { user: { id: userId } },
    })

    const today = new Date()
    const todayDate = today.toISOString().split('T')[0]

    if (!usage) {
      usage = usageRepository.create({
        user: { id: userId },
        dailyCount: 0,
        lastResetDay: new Date(todayDate),
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

    if (usage.dailyCount >= 3) {
      return res
        .status(403)
        .json({ message: 'Daily limit reached (3 chats per day).' })
    }

    usage.dailyCount += 1
    await usageRepository.save(usage)
  }

  next()
}
