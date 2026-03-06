import { getAppConfig } from "../core/config.js";
import { formatBatchShowOutput } from "../core/formatters/format-batch-show-output.js";
import { createMirrorNodeClient } from "../core/mirror-node/mirror-node-client.js";
import { createBatchRepository } from "../core/storage/batch-repository.js";

export async function showBatchCommand(batchId: string): Promise<void> {
  const config = getAppConfig();
  const repository = createBatchRepository(config.storageDirectoryPath);
  const mirrorNodeClient = createMirrorNodeClient(config.mirrorNodeBaseUrl);
  const manifest = await repository.readBatch(batchId);
  const outerTransaction = manifest.execution.outerTransaction
    ? await mirrorNodeClient.getTransaction(manifest.execution.outerTransaction)
    : null;
  const innerTransactions = await Promise.all(
    manifest.execution.innerTransactions.map((transaction) => mirrorNodeClient.getTransaction(transaction)),
  );

  console.log(formatBatchShowOutput({ manifest, outerTransaction, innerTransactions }));
}
