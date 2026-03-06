import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { getAppConfig } from "../core/config.js";
import { createHederaClient } from "../core/hedera-client.js";
import { buildDemoBatch } from "../core/batch/build-demo-batch.js";
import { toTransactionLocator } from "../core/batch/transaction-locator.js";
import { createBatchIndexItem, createExecutedBatchManifest, createFailedBatchManifest, createPendingBatchManifest } from "../core/history/create-batch-manifest.js";
import { createBatchRepository } from "../core/storage/batch-repository.js";
import { formatBatchExecuteOutput } from "../core/formatters/format-batch-execute-output.js";

export async function executeBatchCommand(): Promise<void> {
  const config = getAppConfig();
  const repository = createBatchRepository(config.storageDirectoryPath);
  const batchId = createBatchId();
  const startedAt = new Date().toISOString();
  const startedAtMs = performance.now();
  const { client, operatorId, operatorKey } = createHederaClient(config.network);

  try {
    const builtBatch = await buildDemoBatch({
      client,
      operatorId,
      operatorKey,
      executeConfig: config.demoBatch,
    });

    const pendingManifest = createPendingBatchManifest({
      appConfig: config,
      batchId,
      startedAt,
      operatorId: operatorId.toString(),
      artifacts: builtBatch.artifacts,
    });

    await repository.saveBatch(pendingManifest);
    await repository.upsertIndexItem(createBatchIndexItem(pendingManifest));

    const response = await builtBatch.batchTransaction.execute(client);
    await response.getReceipt(client);

    const outerTransaction = toTransactionLocator(response.transactionId);

    // We persist txId + nonce only.
    // Mirror Node can hydrate the full transaction shape later without local mapping state.
    const innerTransactions = builtBatch.batchTransaction.innerTransactionIds
      .filter((transactionId): transactionId is NonNullable<typeof transactionId> => transactionId !== null)
      .map(toTransactionLocator);

    // We attach each local artifact to its concrete tx locator once the batch has executed.
    // After this step `show` can join local-only data with live Mirror Node results.
    const artifacts = {
      accountCreation: {
        ...builtBatch.artifacts.accountCreation,
        sourceTransaction: innerTransactions[0] ?? null,
      },
      tokenCreation: {
        ...builtBatch.artifacts.tokenCreation,
        sourceTransaction: innerTransactions[1] ?? null,
      },
      hbarTransfer: {
        ...builtBatch.artifacts.hbarTransfer,
        sourceTransaction: innerTransactions[2] ?? null,
      },
    };

    const finishedAt = new Date().toISOString();
    const executedManifest = createExecutedBatchManifest({
      appConfig: config,
      batchId,
      startedAt,
      finishedAt,
      durationMs: Math.round(performance.now() - startedAtMs),
      operatorId: operatorId.toString(),
      artifacts,
      outerTransaction,
      innerTransactions,
    });

    await repository.saveBatch(executedManifest);
    await repository.upsertIndexItem(createBatchIndexItem(executedManifest));

    console.log(formatBatchExecuteOutput(executedManifest));
  } catch (error: unknown) {
    const finishedAt = new Date().toISOString();
    const failedManifest = createFailedBatchManifest({
      appConfig: config,
      batchId,
      startedAt,
      finishedAt,
      durationMs: Math.round(performance.now() - startedAtMs),
      operatorId: operatorId.toString(),
      error,
    });

    await repository.saveBatch(failedManifest);
    await repository.upsertIndexItem(createBatchIndexItem(failedManifest));

    throw error;
  } finally {
    client.close();
  }
}

function createBatchId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `batch_${timestamp}_${randomUUID().slice(0, 8)}`;
}
