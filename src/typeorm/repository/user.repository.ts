import { getDataSource } from "../config/datasource.js";
import { User } from "../entities/user.js";

const AppDataSource = await getDataSource(
  process.env["DATABASE_URL"] ||
    "mysql://root:password@localhost:3306/chat_with_pdf",
);
export const userRepository = AppDataSource.getRepository(User);
