import { getDataSource } from "../config/ormConfig.js";
import { User } from "../entities/user.js";

const AppDataSource = await getDataSource();
export const userRepository = AppDataSource.getRepository(User);
