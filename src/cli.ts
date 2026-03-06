import "dotenv/config";
import { executeBatchCommand } from "./commands/execute-batch.js";
import { listBatchesCommand } from "./commands/list-batches.js";
import { showBatchCommand } from "./commands/show-batch.js";
import { formatCliError } from "./core/formatters/format-cli-error.js";

async function main(): Promise<void> {
  const [, , scope, command, ...args] = process.argv;

  if (scope !== "batch") {
    throw new Error("Usage: pnpm start -- batch <execute|list|show>");
  }

  switch (command) {
    case "execute":
      await executeBatchCommand();
      return;
    case "list":
      await listBatchesCommand();
      return;
    case "show": {
      const [batchId] = args;

      if (!batchId) {
        throw new Error("Usage: pnpm start -- batch show <batchId>");
      }

      await showBatchCommand(batchId);
      return;
    }
    default:
      throw new Error("Usage: pnpm start -- batch <execute|list|show>");
  }
}

main()
  .then(() => {
    // This CLI is strictly one-shot.
    // Force exit to avoid lingering handles from SDK/network internals.
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(formatCliError(error));
    process.exit(1);
  });
