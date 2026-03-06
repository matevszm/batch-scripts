import { join } from "node:path";

export type StoragePaths = {
  readonly storageDirectoryPath: string;
  readonly batchesDirectoryPath: string;
  readonly indexFilePath: string;
};

export function createStoragePaths(storageDirectoryPath: string): StoragePaths {
  return {
    storageDirectoryPath,
    batchesDirectoryPath: join(storageDirectoryPath, "batches"),
    indexFilePath: join(storageDirectoryPath, "index.json"),
  };
}

export function createBatchFilePath(storageDirectoryPath: string, batchId: string): string {
  return join(storageDirectoryPath, "batches", `${batchId}.json`);
}
