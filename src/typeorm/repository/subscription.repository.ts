import { getDataSource } from '../config/ormConfig.js'
import { Subscription } from '../entities/subscription.js'

const AppDataSource = await getDataSource()
export const subscriptionRepository = AppDataSource.getRepository(Subscription)
