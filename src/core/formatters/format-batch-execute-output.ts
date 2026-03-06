import type { BatchManifest } from "../schema/batch-manifest.schema.js";
import { ansi } from "./ansi.js";

export function formatBatchExecuteOutput(manifest: BatchManifest): string {
  return [
    `${ansi.green("🚀 Batch executed")} ${ansi.bold(manifest.meta.batchId)}`,
    `${ansi.gray("├─")} status: ${ansi.green(manifest.meta.status)}`,
    `${ansi.gray("├─")} manifest: ${ansi.cyan(`.batch-history/batches/${manifest.meta.batchId}.json`)}`,
    `${ansi.gray("├─")} ${ansi.bold("🌳 root")} ${ansi.cyan(manifest.execution.outerTransaction?.transactionId ?? "n/a")} ${ansi.dim("[E]")}`,
    `${ansi.gray("├─")} children: ${manifest.execution.innerTransactions.length} ${ansi.dim("[E]")}`,
    `${ansi.gray("└─")} inspect: ${ansi.bold(`pnpm start -- batch show ${manifest.meta.batchId}`)}`,
  ].join("\n");
}
