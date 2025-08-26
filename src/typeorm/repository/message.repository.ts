import { getDataSource } from "../config/ormConfig.js";
import { Message } from "../entities/message.js";

const AppDataSource = await getDataSource();
export const messageRepository = AppDataSource.getRepository(Message);
