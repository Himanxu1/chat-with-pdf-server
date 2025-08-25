// import path from "path";
import { DataSource } from "typeorm";
// import { fileURLToPath } from "url";
import logger from "../../utils/logger.js";
import { User } from "../entities/user.js";

// Derive __dirname for ES modules

let dataSource: DataSource | null = null;

export async function getDataSource(dbUrl: string): Promise<DataSource> {
  logger.info(` Initializing TypeORM DataSource...${JSON.stringify(dbUrl)}`);
  if (dataSource && dataSource.isInitialized) return dataSource;

  dataSource = new DataSource({
    type: "mysql",
    url: dbUrl,
    synchronize: false,
    logging: false,
    entities: [User],
    migrations: [],
  });

  await dataSource.initialize();
  return dataSource;
}

export async function closeDataSource(): Promise<void> {
  if (dataSource?.isInitialized) await dataSource.destroy();
}
