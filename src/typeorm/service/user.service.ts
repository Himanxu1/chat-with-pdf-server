import type { User } from '../entities/user.js'
import { userRepository } from '../repository/user.repository.js'
import bcrypt from 'bcrypt'

export class UserService {
  async createUser(data: Partial<User>): Promise<User> {
    const user = userRepository.create(data)
    return await userRepository.save(user)
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await userRepository.findOneBy({ email })
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const name = username.split(' ')
    return await userRepository.findOneBy({
      firstName: name[0],
      lastName: name[1] ? name[1] : null,
    })
  }

  async findUserById(id: string): Promise<User | null> {
    return await userRepository.findOneBy({ id: id })
  }

  async updateUserProfile(userId: string, updateData: Partial<User>): Promise<User | null> {
    const user = await this.findUserById(userId)
    if (!user) {
      return null
    }

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    await userRepository.update({ id: userId }, updateData)
    return await this.findUserById(userId)
  }

  async updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user) {
      return false
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return false
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await userRepository.update({ id: userId }, { password: hashedNewPassword })
    return true
  }
}
