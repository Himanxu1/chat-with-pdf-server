import { getDataSource } from "../config/ormConfig.js";
import { Chat } from "../entities/chat.js";

const AppDataSource = await getDataSource();
export const chatRepository = AppDataSource.getRepository(Chat);
