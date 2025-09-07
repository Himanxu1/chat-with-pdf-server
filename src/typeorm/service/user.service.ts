import type { User } from '../entities/user.js'
import { userRepository } from '../repository/user.repository.js'

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

  async updateUserProfle(username: string, email: string) {
    const name = username.split(' ')
    return await userRepository.update({}, {})
  }
}
