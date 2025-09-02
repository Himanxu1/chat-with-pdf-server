import { DataSource } from "typeorm";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { User } from "../entities/user.js";
import { Chat } from "../entities/chat.js";
import { Message } from "../entities/message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const config = {
  dbPassword: process.env.DB_PASSWORD ?? "",
  dbName: process.env.DB_NAME ?? "",
  dbUser: process.env.DB_USER ?? "",
  dbHost: process.env.DB_HOST ?? "",
};

export const dataSource: DataSource | null = new DataSource({
  type: "mysql",
  password: config.dbPassword,
  database: config.dbName,
  username: config.dbUser,
  host: config.dbHost,
  synchronize: false,
  logging: false,
  entities: [User, Chat, Message],
  migrations: [path.resolve(__dirname, "../migrations/**/*.{js,ts}")],
});
