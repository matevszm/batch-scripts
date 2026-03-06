import {
  AccountCreateTransaction,
  AccountId,
  BatchTransaction,
  Client,
  Hbar,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType,
  Transaction,
  TransferTransaction,
} from "@hashgraph/sdk";
import type { DemoBatchConfig } from "../config.js";
import type { TransactionLocator } from "../schema/batch-manifest.schema.js";

type BuildDemoBatchArgs = {
  readonly client: Client;
  readonly operatorId: AccountId;
  readonly operatorKey: PrivateKey;
  readonly executeConfig: DemoBatchConfig;
};

type PreparedOperation = {
  readonly transaction: Transaction;
};

type PreparedAccountOperation = PreparedOperation & {
  readonly generatedPrivateKey: string;
  readonly generatedPublicKey: string;
  readonly evmAddress: string;
};

type PreparedTokenOperation = PreparedOperation & {
  readonly adminPrivateKey: string;
  readonly adminPublicKey: string;
  readonly supplyPrivateKey: string;
  readonly supplyPublicKey: string;
};

export type DemoBatchArtifacts = {
  readonly accountCreation: {
    readonly sourceTransaction: TransactionLocator | null;
    readonly generatedPrivateKey: string;
    readonly generatedPublicKey: string;
    readonly evmAddress: string;
    readonly initialBalanceHbar: string;
  };
  readonly tokenCreation: {
    readonly sourceTransaction: TransactionLocator | null;
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly tokenDecimals: number;
    readonly tokenInitialSupply: number;
    readonly tokenMaxSupply: number;
    readonly tokenMemo: string;
    readonly treasuryAccountId: string;
    readonly adminPrivateKey: string;
    readonly adminPublicKey: string;
    readonly supplyPrivateKey: string;
    readonly supplyPublicKey: string;
  };
  readonly hbarTransfer: {
    readonly sourceTransaction: TransactionLocator | null;
    readonly senderAccountId: string;
    readonly recipientAccountId: string;
    readonly amountHbar: string;
  };
};

type BuildDemoBatchResult = {
  readonly batchTransaction: BatchTransaction;
  readonly artifacts: DemoBatchArtifacts;
};

export async function buildDemoBatch(args: BuildDemoBatchArgs): Promise<BuildDemoBatchResult> {
  const batchKey = PrivateKey.generateECDSA();

  const [accountOperation, tokenOperation, transferOperation] = await Promise.all([
    prepareCreateAccountOperation(args.client, args.operatorKey, args.executeConfig, batchKey),
    prepareCreateTokenOperation(args.client, args.operatorId, args.operatorKey, args.executeConfig, batchKey),
    prepareTransferHbarOperation(args.client, args.operatorId, args.operatorKey, args.executeConfig, batchKey),
  ]);

  const batchTransaction = new BatchTransaction()
    .addInnerTransaction(accountOperation.transaction)
    .addInnerTransaction(tokenOperation.transaction)
    .addInnerTransaction(transferOperation.transaction)
    .freezeWith(args.client);

  // The outer batch still needs its own signatures.
  // Inner tx signatures authorize the payload, batchKey seals the bundle.
  await batchTransaction.sign(args.operatorKey);
  await batchTransaction.sign(batchKey);

  return {
    batchTransaction,
    artifacts: {
      accountCreation: {
        sourceTransaction: null,
        generatedPrivateKey: accountOperation.generatedPrivateKey,
        generatedPublicKey: accountOperation.generatedPublicKey,
        evmAddress: accountOperation.evmAddress,
        initialBalanceHbar: args.executeConfig.createdAccountInitialBalanceHbar,
      },
      tokenCreation: {
        sourceTransaction: null,
        tokenName: args.executeConfig.tokenName,
        tokenSymbol: args.executeConfig.tokenSymbol,
        tokenDecimals: args.executeConfig.tokenDecimals,
        tokenInitialSupply: args.executeConfig.tokenInitialSupply,
        tokenMaxSupply: args.executeConfig.tokenMaxSupply,
        tokenMemo: args.executeConfig.tokenMemo,
        treasuryAccountId: args.operatorId.toString(),
        adminPrivateKey: tokenOperation.adminPrivateKey,
        adminPublicKey: tokenOperation.adminPublicKey,
        supplyPrivateKey: tokenOperation.supplyPrivateKey,
        supplyPublicKey: tokenOperation.supplyPublicKey,
      },
      hbarTransfer: {
        sourceTransaction: null,
        senderAccountId: args.operatorId.toString(),
        recipientAccountId: args.executeConfig.transferRecipientAccountId,
        amountHbar: args.executeConfig.hbarTransferAmountHbar,
      },
    },
  };
}

async function prepareCreateAccountOperation(
  client: Client,
  operatorKey: PrivateKey,
  config: DemoBatchConfig,
  batchKey: PrivateKey,
): Promise<PreparedAccountOperation> {
  const accountKey = PrivateKey.generateECDSA();
  const accountInitialBalance = Hbar.fromString(config.createdAccountInitialBalanceHbar);

  const transaction = await new AccountCreateTransaction()
    .setECDSAKeyWithAlias(accountKey.publicKey)
    .setInitialBalance(accountInitialBalance)
    // `batchify` binds this tx to the shared batch key before execution.
    .batchify(client, batchKey.publicKey);

  const signedTransaction = await transaction.sign(operatorKey);

  return {
    transaction: signedTransaction,
    generatedPrivateKey: accountKey.toString(),
    generatedPublicKey: accountKey.publicKey.toStringRaw(),
    evmAddress: `0x${accountKey.publicKey.toEvmAddress()}`,
  };
}

async function prepareCreateTokenOperation(
  client: Client,
  operatorId: AccountId,
  operatorKey: PrivateKey,
  config: DemoBatchConfig,
  batchKey: PrivateKey,
): Promise<PreparedTokenOperation> {
  const adminKey = PrivateKey.generateECDSA();
  const supplyKey = PrivateKey.generateECDSA();

  const transaction = await new TokenCreateTransaction()
    .setTokenName(config.tokenName)
    .setTokenSymbol(config.tokenSymbol)
    .setDecimals(config.tokenDecimals)
    .setInitialSupply(config.tokenInitialSupply)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(config.tokenMaxSupply)
    .setTreasuryAccountId(operatorId)
    .setAdminKey(adminKey.publicKey)
    .setSupplyKey(supplyKey.publicKey)
    .setTokenMemo(config.tokenMemo)
    // Every child tx is prepared against the same batch key.
    .batchify(client, batchKey.publicKey);

  const operatorSignedTransaction = await transaction.sign(operatorKey);
  const fullySignedTransaction = await operatorSignedTransaction.sign(adminKey);

  return {
    transaction: fullySignedTransaction,
    adminPrivateKey: adminKey.toString(),
    adminPublicKey: adminKey.publicKey.toStringRaw(),
    supplyPrivateKey: supplyKey.toString(),
    supplyPublicKey: supplyKey.publicKey.toStringRaw(),
  };
}

async function prepareTransferHbarOperation(
  client: Client,
  operatorId: AccountId,
  operatorKey: PrivateKey,
  config: DemoBatchConfig,
  batchKey: PrivateKey,
): Promise<PreparedOperation> {
  const amount = Hbar.fromString(config.hbarTransferAmountHbar);
  const recipientAccountId = AccountId.fromString(config.transferRecipientAccountId);

  const transaction = await new TransferTransaction()
    .addHbarTransfer(operatorId, amount.negated())
    .addHbarTransfer(recipientAccountId, amount)
    // This keeps the transfer as a child tx instead of a standalone execution.
    .batchify(client, batchKey.publicKey);

  const signedTransaction = await transaction.sign(operatorKey);

  return {
    transaction: signedTransaction,
  };
}
