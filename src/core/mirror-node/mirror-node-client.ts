import type { MirrorNodeTransaction } from "./mirror-node.schema.js";
import { MirrorNodeTransactionByIdResponseSchema } from "./mirror-node.schema.js";
import type { TransactionLocator } from "../schema/batch-manifest.schema.js";

export type MirrorNodeClient = {
  readonly getTransaction: (locator: TransactionLocator) => Promise<MirrorNodeTransaction>;
};

export function createMirrorNodeClient(baseUrl: string): MirrorNodeClient {
  return {
    getTransaction: async (locator) => {
      const url = new URL(`${baseUrl}/transactions/${locator.transactionId}`);
      url.searchParams.set("nonce", String(locator.nonce));

      const response = await fetch(url, {
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Mirror Node request failed: ${response.status} ${response.statusText}`);
      }

      const parsed = MirrorNodeTransactionByIdResponseSchema.parse(await response.json());
      const transaction = parsed.transactions.at(0);

      if (!transaction) {
        throw new Error(`Mirror Node returned no transaction for ${locator.transactionId} nonce=${locator.nonce}`);
      }

      return transaction;
    },
  };
}
