import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserService } from '../../typeorm/service/user.service.js'
import { env } from '../../config/env.js'
import { planRepository } from '../../typeorm/repository/plan.repository.js'
import { subscriptionRepository } from '../../typeorm/repository/subscription.repository.js'

class AuthController {
  public static instance: AuthController
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  static getInstance() {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController()
    }
    return AuthController.instance
  }

  public register = async (req: any, res: any) => {
    try {
      const { username, password, email } = req.body
      if (!username || !password || !email) {
        return res
          .status(400)
          .json({ error: 'Username, password, and email required' })
      }

      // Check if user already exists
      const existingUser = await this.userService.findUserByUsername(username)
      if (existingUser) {
        return res
          .status(409)
          .json({ error: 'User with that username already exists' })
      }
      const existingEmail = await this.userService.findUserByEmail(email)
      if (existingEmail) {
        return res
          .status(409)
          .json({ error: 'User with that email already exists' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      const name = username.split(' ')

      // Save user to database
      const newUser = await this.userService.createUser({
        firstName: name[0],
        lastName: name[1],
        password: hashedPassword,
        email,
      })
      const freePlan = await planRepository.findOne({ where: { name: 'Free' } })

      const sub = subscriptionRepository.create({
        user: newUser,
        plan: freePlan,
        status: 'active',
        razorpaySubscriptionId: null,
        currentStart: Date.now() / 1000,
        currentEnd: null, // free plan has no expiry
      })

      await subscriptionRepository.save(sub)

      res.json({
        message: 'User registered successfully',
        status: true,
        user: {
          username: newUser.firstName + newUser.lastName,
          email: newUser.email,
        },
      })
    } catch (err: any) {
      console.error('Error registering user:', err)
      return res.status(500).json({ error: 'Failed to register user' })
    }
  }

  public login = async (req: any, res: any) => {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ error: 'Username and password required' })
      }

      // Find user by username
      const user = await this.userService.findUserByEmail(email)

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.firstName + user.lastName,
          email: user.email,
        },
        env.JWT_SECRET,
        { expiresIn: '1h' },
      )

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      })

      res.json({
        message: 'User logged in successfully',
        status: true,
        user: {
          username: user.firstName + user.lastName,
          email: user.email,
          id: user.id,
        },
        token,
      })
    } catch (err: any) {
      console.error('Error logging in user:', err)
      return res
        .status(500)
        .json({ error: 'Failed to log in user', status: false })
    }
  }

  public logout = async (req: any, res: any) => {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
      return res.json({ success: true, message: 'Logged out successfully' })
    } catch (err: any) {
      console.error('Error logging out user:', err)
      return res
        .status(500)
        .json({ error: 'Failed to logout user', status: false })
    }
  }

  public updateProfile = async (req: any, res: any) => {
    try {
      const { username, email } = req.body


      if(!username && !email){
        return res.send('')
      }


    } catch (err) {
      console.error('Error updating profile:', err)
      return res
        .status(500)
        .json({ error: 'Failed to update user profile', status: false })
    }
  }
}

const AuthControllerService = AuthController.getInstance()

export default AuthControllerService
