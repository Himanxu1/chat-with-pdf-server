import { DataSource } from 'typeorm'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { User } from '../entities/user.js'
import { Chat } from '../entities/chat.js'
import { Message } from '../entities/message.js'
import logger from '../../utils/logger.js'
import { Plan } from '../entities/plan.js'
import { Subscription } from '../entities/subscription.js'
import { WebhookEventLog } from '../entities/webhook.js'
import { Usage } from '../entities/usage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const config = {
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbName: process.env.DB_NAME ?? '',
  dbUser: process.env.DB_USER ?? '',
  dbHost: process.env.DB_HOST ?? '',
}

logger.info(`${JSON.stringify(config)}====config`)

export const dataSource: DataSource | null = new DataSource({
  type: 'mysql',
  password: config.dbPassword,
  database: config.dbName,
  username: config.dbUser,
  host: config.dbHost,
  synchronize: false,
  ssl: false,
  logging: false,
  entities: [User, Chat, Message, Plan, Subscription, WebhookEventLog, Usage],
  migrations: [path.resolve(__dirname, '../migrations/**/*.{js,ts}')],
})
