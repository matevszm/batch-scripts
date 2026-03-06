import { getAppConfig } from "../core/config.js";
import { formatBatchListOutput } from "../core/formatters/format-batch-list-output.js";
import { createBatchRepository } from "../core/storage/batch-repository.js";

export async function listBatchesCommand(): Promise<void> {
  const config = getAppConfig();
  const repository = createBatchRepository(config.storageDirectoryPath);
  const index = await repository.readIndex();

  console.log(formatBatchListOutput(index.items));
}
