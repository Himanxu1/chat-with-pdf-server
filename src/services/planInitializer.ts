import { dataSource } from '../typeorm/config/datasource.js'
import { Plan } from '../typeorm/entities/plan.js'
import logger from '../utils/logger.js'

export class PlanInitializerService {
  private static instance: PlanInitializerService

  static getInstance() {
    if (!PlanInitializerService.instance) {
      PlanInitializerService.instance = new PlanInitializerService()
    }
    return PlanInitializerService.instance
  }

  /**
   * Initialize or update plan limits in the database
   */
  async initializePlans(): Promise<void> {
    try {
      const planRepository = dataSource.getRepository(Plan)

      const plans = [
        {
          name: 'Free',
          price: 0,
          interval: 'monthly',
          razorpayPlanId: null,
          dailyPdfLimit: 2,
          monthlyPdfLimit: 10,
          maxFileSizeMb: 10,
        },
        {
          name: 'Basic',
          price: 1500, // ₹15 in paise
          interval: 'monthly',
          razorpayPlanId: null, // Set this when creating Razorpay plans
          dailyPdfLimit: 30,
          monthlyPdfLimit: 200,
          maxFileSizeMb: 40,
        },
        {
          name: 'Pro',
          price: 2500, // ₹25 in paise
          interval: 'monthly',
          razorpayPlanId: null, // Set this when creating Razorpay plans
          dailyPdfLimit: 200,
          monthlyPdfLimit: -1, // Unlimited
          maxFileSizeMb: 1024, // 1GB
        },
      ]

      for (const planData of plans) {
        let plan = await planRepository.findOne({ where: { name: planData.name } })
        
        if (plan) {
          // Update existing plan with new limits
          await planRepository.update(
            { name: planData.name },
            {
              dailyPdfLimit: planData.dailyPdfLimit,
              monthlyPdfLimit: planData.monthlyPdfLimit,
              maxFileSizeMb: planData.maxFileSizeMb,
            }
          )
          logger.info(`Updated plan: ${planData.name}`)
        } else {
          // Create new plan
          plan = planRepository.create(planData)
          await planRepository.save(plan)
          logger.info(`Created new plan: ${planData.name}`)
        }
      }

      logger.info('Plan initialization completed successfully')
    } catch (error) {
      logger.error('Error initializing plans:', error)
      throw error
    }
  }

  /**
   * Get plan limits for a specific plan name
   */
  async getPlanLimits(planName: string): Promise<{
    dailyPdfLimit: number
    monthlyPdfLimit: number
    maxFileSizeMb: number
  } | null> {
    try {
      const planRepository = dataSource.getRepository(Plan)
      const plan = await planRepository.findOne({ where: { name: planName } })
      
      if (!plan) {
        return null
      }

      return {
        dailyPdfLimit: plan.dailyPdfLimit,
        monthlyPdfLimit: plan.monthlyPdfLimit,
        maxFileSizeMb: plan.maxFileSizeMb,
      }
    } catch (error) {
      logger.error('Error getting plan limits:', error)
      return null
    }
  }

  /**
   * Validate if a file size is within plan limits
   */
  async validateFileSize(planName: string, fileSizeInMB: number): Promise<boolean> {
    const limits = await this.getPlanLimits(planName)
    if (!limits) {
      return false
    }
    return fileSizeInMB <= limits.maxFileSizeMb
  }

  /**
   * Get usage statistics for a plan
   */
  async getPlanUsageStats(planName: string): Promise<{
    totalUsers: number
    activeUsers: number
    averageDailyUsage: number
    averageMonthlyUsage: number
  } | null> {
    try {
      const subscriptionRepository = dataSource.getRepository('Subscription')
      const usageRepository = dataSource.getRepository('Usage')
      const planRepository = dataSource.getRepository(Plan)

      const plan = await planRepository.findOne({ where: { name: planName } })
      if (!plan) {
        return null
      }

      // Get total users with this plan
      const totalUsers = await subscriptionRepository.count({
        where: { plan: { id: plan.id } }
      })

      // Get active users
      const activeUsers = await subscriptionRepository.count({
        where: { plan: { id: plan.id }, status: 'active' }
      })

      // Get average usage (simplified calculation)
      const allUsage = await usageRepository.find({
        relations: ['user']
      })

      const planUsers = await subscriptionRepository.find({
        where: { plan: { id: plan.id }, status: 'active' },
        relations: ['user']
      })

      const planUserIds = planUsers.map(sub => sub.user.id)
      const planUsage = allUsage.filter(usage => planUserIds.includes(usage.user.id))

      const averageDailyUsage = planUsage.length > 0 
        ? planUsage.reduce((sum, usage) => sum + usage.dailyCount, 0) / planUsage.length 
        : 0

      const averageMonthlyUsage = planUsage.length > 0 
        ? planUsage.reduce((sum, usage) => sum + usage.monthlyCount, 0) / planUsage.length 
        : 0

      return {
        totalUsers,
        activeUsers,
        averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
        averageMonthlyUsage: Math.round(averageMonthlyUsage * 100) / 100,
      }
    } catch (error) {
      logger.error('Error getting plan usage stats:', error)
      return null
    }
  }
}

export const planInitializerService = PlanInitializerService.getInstance()
