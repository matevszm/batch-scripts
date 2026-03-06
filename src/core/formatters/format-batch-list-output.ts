import type { BatchIndexItem } from "../schema/batch-index.schema.js";
import { ansi } from "./ansi.js";

export function formatBatchListOutput(items: readonly BatchIndexItem[]): string {
  if (items.length === 0) {
    return `${ansi.blue("📭 No batch executions stored.")}`;
  }

  const lines = [ansi.bold("📦 Batch Executions")];

  for (const item of items) {
    const statusLabel = formatStatus(item.status);
    const rootId = item.outerTransactionId ?? "precheck failed before outer tx id";

    lines.push(`${statusLabel} ${ansi.bold(item.batchId)}`);
    lines.push(`   ${ansi.gray("├─")} root: ${ansi.cyan(rootId)}`);
    lines.push(`   ${ansi.gray("├─")} network: ${item.network}`);
    lines.push(`   ${ansi.gray("├─")} created: ${item.createdAt}`);
    lines.push(`   ${ansi.gray("└─")} children: ${item.innerTransactionCount}`);
  }

  return lines.join("\n");
}

function formatStatus(status: BatchIndexItem["status"]): string {
  switch (status) {
    case "executed":
      return ansi.green("✅ executed");
    case "pending":
      return ansi.yellow("🟡 pending");
    case "failed":
      return ansi.red("❌ failed");
  }
}
