import type { AppConfig } from "../config.js";
import type { BatchManifest, BatchManifestStatus, TransactionLocator } from "../schema/batch-manifest.schema.js";
import type { BatchIndexItem } from "../schema/batch-index.schema.js";
import type { DemoBatchArtifacts } from "../batch/build-demo-batch.js";

type SharedArgs = {
  readonly appConfig: AppConfig;
  readonly batchId: string;
  readonly operatorId: string;
  readonly startedAt: string;
};

type PendingArgs = SharedArgs & {
  readonly artifacts: DemoBatchArtifacts;
};

type ExecutedArgs = PendingArgs & {
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly outerTransaction: TransactionLocator;
  readonly innerTransactions: readonly TransactionLocator[];
};

type FailedArgs = SharedArgs & {
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly error: unknown;
};

export function createPendingBatchManifest(args: PendingArgs): BatchManifest {
  return {
    meta: createMeta(args.appConfig, args.batchId, args.startedAt, args.startedAt, "pending"),
    input: {
      operatorId: args.operatorId,
      executeConfig: args.appConfig.demoBatch,
    },
    execution: {
      startedAt: args.startedAt,
      finishedAt: null,
      durationMs: null,
      outerTransaction: null,
      innerTransactions: [],
    },
    artifacts: args.artifacts,
    error: null,
  };
}

export function createExecutedBatchManifest(args: ExecutedArgs): BatchManifest {
  return {
    meta: createMeta(args.appConfig, args.batchId, args.startedAt, args.finishedAt, "executed"),
    input: {
      operatorId: args.operatorId,
      executeConfig: args.appConfig.demoBatch,
    },
    execution: {
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      durationMs: args.durationMs,
      outerTransaction: args.outerTransaction,
      innerTransactions: [...args.innerTransactions],
    },
    artifacts: args.artifacts,
    error: null,
  };
}

export function createFailedBatchManifest(args: FailedArgs): BatchManifest {
  return {
    meta: createMeta(args.appConfig, args.batchId, args.startedAt, args.finishedAt, "failed"),
    input: {
      operatorId: args.operatorId,
      executeConfig: args.appConfig.demoBatch,
    },
    execution: {
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      durationMs: args.durationMs,
      outerTransaction: null,
      innerTransactions: [],
    },
    artifacts: emptyArtifacts(args.appConfig),
    error: toErrorInfo(args.error),
  };
}

export function createBatchIndexItem(manifest: BatchManifest): BatchIndexItem {
  return {
    batchId: manifest.meta.batchId,
    createdAt: manifest.meta.createdAt,
    updatedAt: manifest.meta.updatedAt,
    network: manifest.meta.network,
    status: manifest.meta.status,
    outerTransactionId: manifest.execution.outerTransaction?.transactionId ?? null,
    innerTransactionCount: manifest.execution.innerTransactions.length,
  };
}

function createMeta(
  appConfig: AppConfig,
  batchId: string,
  createdAt: string,
  updatedAt: string,
  status: BatchManifestStatus,
): BatchManifest["meta"] {
  return {
    schemaVersion: 1,
    batchId,
    createdAt,
    updatedAt,
    command: "batch execute",
    network: appConfig.network,
    cliVersion: appConfig.cliVersion,
    status,
  };
}

function emptyArtifacts(appConfig: AppConfig): DemoBatchArtifacts {
  return {
    accountCreation: {
      sourceTransaction: null,
      generatedPrivateKey: "unavailable",
      generatedPublicKey: "unavailable",
      evmAddress: "unavailable",
      initialBalanceHbar: appConfig.demoBatch.createdAccountInitialBalanceHbar,
    },
    tokenCreation: {
      sourceTransaction: null,
      tokenName: appConfig.demoBatch.tokenName,
      tokenSymbol: appConfig.demoBatch.tokenSymbol,
      tokenDecimals: appConfig.demoBatch.tokenDecimals,
      tokenInitialSupply: appConfig.demoBatch.tokenInitialSupply,
      tokenMaxSupply: appConfig.demoBatch.tokenMaxSupply,
      tokenMemo: appConfig.demoBatch.tokenMemo,
      treasuryAccountId: "unavailable",
      adminPrivateKey: "unavailable",
      adminPublicKey: "unavailable",
      supplyPrivateKey: "unavailable",
      supplyPublicKey: "unavailable",
    },
    hbarTransfer: {
      sourceTransaction: null,
      senderAccountId: "unavailable",
      recipientAccountId: appConfig.demoBatch.transferRecipientAccountId,
      amountHbar: appConfig.demoBatch.hbarTransferAmountHbar,
    },
  };
}

function toErrorInfo(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    message: "Unknown error",
    stack: null,
  };
}
