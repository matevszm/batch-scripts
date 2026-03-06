import { z } from "zod";

const MirrorNodeBatchKeySchema = z.object({
  _type: z.string(),
  key: z.string(),
});

const MirrorNodeTransferSchema = z.object({
  account: z.string(),
  amount: z.number().int(),
  is_approval: z.boolean().nullable().optional(),
});

const MirrorNodeTokenTransferSchema = z.object({
  token_id: z.string(),
  account: z.string(),
  amount: z.number().int(),
  is_approval: z.boolean().nullable().optional(),
});

const MirrorNodeNftTransferSchema = z.object({
  token_id: z.string(),
  serial_number: z.number().int(),
  sender_account_id: z.string().nullable(),
  receiver_account_id: z.string().nullable(),
  is_approval: z.boolean().nullable().optional(),
});

export const MirrorNodeTransactionSchema = z.object({
  batch_key: MirrorNodeBatchKeySchema.nullable(),
  charged_tx_fee: z.number().int(),
  consensus_timestamp: z.string(),
  entity_id: z.string().nullable(),
  memo_base64: z.string().nullable(),
  name: z.string(),
  nft_transfers: z.array(MirrorNodeNftTransferSchema),
  nonce: z.number().int(),
  parent_consensus_timestamp: z.string().nullable(),
  result: z.string(),
  token_transfers: z.array(MirrorNodeTokenTransferSchema),
  transaction_hash: z.string(),
  transaction_id: z.string(),
  transfers: z.array(MirrorNodeTransferSchema),
});

export const MirrorNodeTransactionByIdResponseSchema = z.object({
  transactions: z.array(MirrorNodeTransactionSchema),
});

export type MirrorNodeTransaction = z.infer<typeof MirrorNodeTransactionSchema>;
