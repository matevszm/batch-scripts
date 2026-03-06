import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { BatchManifestSchema, type BatchManifest } from "../schema/batch-manifest.schema.js";
import { BatchIndexSchema, type BatchIndex, type BatchIndexItem } from "../schema/batch-index.schema.js";
import { createBatchFilePath, createStoragePaths } from "./storage-paths.js";
import { readJsonFile } from "./read-json.js";
import { writeJsonFile } from "./write-json.js";

export type BatchRepository = {
  readonly saveBatch: (manifest: BatchManifest) => Promise<void>;
  readonly readBatch: (batchId: string) => Promise<BatchManifest>;
  readonly readIndex: () => Promise<BatchIndex>;
  readonly upsertIndexItem: (item: BatchIndexItem) => Promise<void>;
};

export function createBatchRepository(storageDirectoryPath: string): BatchRepository {
  const paths = createStoragePaths(storageDirectoryPath);

  return {
    saveBatch: async (manifest) => {
      await ensureStorageDirectories(paths.storageDirectoryPath, paths.batchesDirectoryPath);
      await writeJsonFile(createBatchFilePath(paths.storageDirectoryPath, manifest.meta.batchId), manifest);
    },
    readBatch: async (batchId) => {
      return readJsonFile(createBatchFilePath(paths.storageDirectoryPath, batchId), BatchManifestSchema);
    },
    readIndex: async () => {
      await ensureStorageDirectories(paths.storageDirectoryPath, paths.batchesDirectoryPath);

      if (!(await fileExists(paths.indexFilePath))) {
        return { schemaVersion: 1, items: [] };
      }

      return readJsonFile(paths.indexFilePath, BatchIndexSchema);
    },
    upsertIndexItem: async (item) => {
      await ensureStorageDirectories(paths.storageDirectoryPath, paths.batchesDirectoryPath);

      const currentIndex = await readExistingIndex(paths.indexFilePath);
      const remainingItems = currentIndex.items.filter((currentItem) => currentItem.batchId !== item.batchId);
      const nextIndex: BatchIndex = {
        schemaVersion: 1,
        items: [item, ...remainingItems].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      };

      await writeJsonFile(paths.indexFilePath, nextIndex);
    },
  };
}

async function ensureStorageDirectories(storageDirectoryPath: string, batchesDirectoryPath: string): Promise<void> {
  await mkdir(storageDirectoryPath, { recursive: true });
  await mkdir(batchesDirectoryPath, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readExistingIndex(indexFilePath: string): Promise<BatchIndex> {
  if (!(await fileExists(indexFilePath))) {
    return { schemaVersion: 1, items: [] };
  }

  return readJsonFile(indexFilePath, BatchIndexSchema);
}
