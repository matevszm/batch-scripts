import { z } from "zod";
import { BatchManifestStatusSchema } from "./batch-manifest.schema.js";

export const BatchIndexItemSchema = z.object({
  batchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  network: z.string(),
  status: BatchManifestStatusSchema,
  outerTransactionId: z.string().nullable(),
  innerTransactionCount: z.number().int().nonnegative(),
});

export const BatchIndexSchema = z.object({
  schemaVersion: z.literal(1),
  items: z.array(BatchIndexItemSchema),
});

export type BatchIndex = z.infer<typeof BatchIndexSchema>;
export type BatchIndexItem = z.infer<typeof BatchIndexItemSchema>;
