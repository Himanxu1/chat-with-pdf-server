import { getDataSource } from '../config/ormConfig.js'
import { Plan } from '../entities/plan.js'

const AppDataSource = await getDataSource()
export const planRepository = AppDataSource.getRepository(Plan)
