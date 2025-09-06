import { getDataSource } from '../config/ormConfig.js'
import { WebhookEventLog } from '../entities/webhook.js'

const AppDataSource = await getDataSource()
export const webhookRepository = AppDataSource.getRepository(WebhookEventLog)
