import { getDataSource } from '../config/ormConfig.js'
import { Usage } from '../entities/usage.js'

const AppDataSource = await getDataSource()
export const usageRepository = AppDataSource.getRepository(Usage)
