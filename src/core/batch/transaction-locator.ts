import { TransactionId } from "@hashgraph/sdk";
import type { TransactionLocator } from "../schema/batch-manifest.schema.js";

export function toTransactionLocator(transactionId: TransactionId): TransactionLocator {
  const accountId = transactionId.accountId?.toString();
  const seconds = transactionId.validStart?.seconds.toString();
  const nanos = transactionId.validStart?.nanos.toString().padStart(9, "0");

  if (!accountId || !seconds || !nanos) {
    throw new Error("TransactionId is missing accountId or validStart");
  }

  return {
    transactionId: `${accountId}-${seconds}-${nanos}`,
    nonce: Number(transactionId.nonce ?? 0),
  };
}
