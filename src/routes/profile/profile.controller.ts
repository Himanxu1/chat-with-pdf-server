import type { Response } from 'express'
import { UserService } from '../../typeorm/service/user.service.js'
import { subscriptionRepository } from '../../typeorm/repository/subscription.repository.js'
import { usageRepository } from '../../typeorm/repository/usage.repository.js'
import logger from '../../utils/logger.js'
import type { AuthenticatedRequest } from '../../middleware/authenticateToken.js'

class ProfileController {
  public static instance: ProfileController
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  static getInstance() {
    if (!ProfileController.instance) {
      ProfileController.instance = new ProfileController()
    }
    return ProfileController.instance
  }

  public updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id
      const { firstName, lastName, email } = req.body

      if (!firstName || !email) {
        return res
          .status(400)
          .json({ error: 'First name and email are required' })
      }

      // Check if email is already taken by another user
      const existingUser = await this.userService.findUserByEmail(email)
      if (existingUser && existingUser.id !== userId) {
        return res
          .status(409)
          .json({ error: 'Email is already taken by another user' })
      }

      const updateData: any = { firstName, email }
      if (lastName) {
        updateData.lastName = lastName
      }

      const updatedUser = await this.userService.updateUserProfile(
        userId,
        updateData,
      )

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
        },
      })
    } catch (error) {
      logger.error('Error updating profile:', error)
      return res.status(500).json({ error: 'Failed to update profile' })
    }
  }

  public updatePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id
      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: 'Current password and new password are required' })
      }

      // Enhanced password validation
      const passwordValidation = this.validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        })
      }

      // Check if new password is different from current password
      if (currentPassword === newPassword) {
        return res.status(400).json({ 
          error: 'New password must be different from current password' 
        })
      }

      const success = await this.userService.updateUserPassword(
        userId,
        currentPassword,
        newPassword,
      )

      if (!success) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }

      // Log password change for security audit
      logger.info(`Password changed for user ${userId}`, {
        userId,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })

      return res.json({ message: 'Password updated successfully' })
    } catch (error) {
      logger.error('Error updating password:', error)
      return res.status(500).json({ error: 'Failed to update password' })
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 128) {
      errors.push('Password must be no more than 128 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common patterns
    const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'admin', 'user']
    const lowerPassword = password.toLowerCase()
    for (const pattern of commonPatterns) {
      if (lowerPassword.includes(pattern)) {
        errors.push(`Password cannot contain common patterns like "${pattern}"`)
        break
      }
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  public getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id

      const user = await this.userService.findUserById(userId)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Get user's subscription info
      const subscription = await subscriptionRepository.findOne({
        where: { user: { id: userId }, status: 'active' },
        relations: ['plan'],
      })

      // Get usage info
      const usage = await usageRepository.findOne({
        where: { user: { id: userId } },
      })

      return res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: user.createdAt,
        },
        subscription: subscription
          ? {
              plan: subscription.plan.name,
              status: subscription.status,
            }
          : null,
        usage: usage
          ? {
              dailyCount: usage.dailyCount,
              monthlyCount: usage.monthlyCount,
            }
          : null,
      })
    } catch (error) {
      logger.error('Error getting user profile:', error)
      return res.status(500).json({ error: 'Failed to get user profile' })
    }
  }
}

const ProfileControllerService = ProfileController.getInstance()
export default ProfileControllerService
