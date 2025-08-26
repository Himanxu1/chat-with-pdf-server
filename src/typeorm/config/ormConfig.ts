import { dataSource } from "./datasource.js";

export async function getDataSource() {
  if (dataSource && dataSource.isInitialized) return dataSource;
  if (!dataSource) {
    await dataSource.initialize();
  }

  return dataSource;
}

export async function closeDataSource(): Promise<void> {
  if (dataSource?.isInitialized) await dataSource.destroy();
}
