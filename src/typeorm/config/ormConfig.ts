import { dataSource } from "./datasource.js";

export async function getDataSource() {
  if (dataSource && !dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export async function closeDataSource(): Promise<void> {
  if (dataSource?.isInitialized) await dataSource.destroy();
}
