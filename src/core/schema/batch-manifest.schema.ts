import { z } from "zod";

export const BatchManifestStatusSchema = z.enum(["pending", "executed", "failed"]);

export const TransactionLocatorSchema = z.object({
  transactionId: z.string(),
  nonce: z.number().int().nonnegative(),
});

const ErrorInfoSchema = z.object({
  message: z.string(),
  stack: z.string().nullable(),
});

const BatchMetaSchema = z.object({
  schemaVersion: z.literal(1),
  batchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  command: z.literal("batch execute"),
  network: z.string(),
  cliVersion: z.string(),
  status: BatchManifestStatusSchema,
});

const ExecuteConfigSchema = z.object({
  transferRecipientAccountId: z.string(),
  createdAccountInitialBalanceHbar: z.string(),
  hbarTransferAmountHbar: z.string(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenDecimals: z.number().int().nonnegative(),
  tokenInitialSupply: z.number().int().nonnegative(),
  tokenMaxSupply: z.number().int().nonnegative(),
  tokenMemo: z.string(),
});

const CreateAccountArtifactSchema = z.object({
  sourceTransaction: TransactionLocatorSchema.nullable(),
  generatedPrivateKey: z.string(),
  generatedPublicKey: z.string(),
  evmAddress: z.string(),
  initialBalanceHbar: z.string(),
});

const CreateTokenArtifactSchema = z.object({
  sourceTransaction: TransactionLocatorSchema.nullable(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenDecimals: z.number().int().nonnegative(),
  tokenInitialSupply: z.number().int().nonnegative(),
  tokenMaxSupply: z.number().int().nonnegative(),
  tokenMemo: z.string(),
  treasuryAccountId: z.string(),
  adminPrivateKey: z.string(),
  adminPublicKey: z.string(),
  supplyPrivateKey: z.string(),
  supplyPublicKey: z.string(),
});

const TransferHbarArtifactSchema = z.object({
  sourceTransaction: TransactionLocatorSchema.nullable(),
  senderAccountId: z.string(),
  recipientAccountId: z.string(),
  amountHbar: z.string(),
});

const BatchArtifactsSchema = z.object({
  accountCreation: CreateAccountArtifactSchema,
  tokenCreation: CreateTokenArtifactSchema,
  hbarTransfer: TransferHbarArtifactSchema,
});

export const BatchManifestSchema = z.object({
  meta: BatchMetaSchema,
  input: z.object({
    operatorId: z.string(),
    executeConfig: ExecuteConfigSchema,
  }),
  execution: z.object({
    startedAt: z.string(),
    finishedAt: z.string().nullable(),
    durationMs: z.number().int().nonnegative().nullable(),
    outerTransaction: TransactionLocatorSchema.nullable(),
    innerTransactions: z.array(TransactionLocatorSchema),
  }),
  artifacts: BatchArtifactsSchema,
  error: ErrorInfoSchema.nullable(),
});

export type BatchManifest = z.infer<typeof BatchManifestSchema>;
export type BatchManifestStatus = z.infer<typeof BatchManifestStatusSchema>;
export type TransactionLocator = z.infer<typeof TransactionLocatorSchema>;
