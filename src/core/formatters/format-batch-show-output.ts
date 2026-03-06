import type { MirrorNodeTransaction } from "../mirror-node/mirror-node.schema.js";
import type { BatchManifest } from "../schema/batch-manifest.schema.js";
import { ansi } from "./ansi.js";

type BatchShowPayload = {
  readonly manifest: BatchManifest;
  readonly outerTransaction: MirrorNodeTransaction | null;
  readonly innerTransactions: readonly MirrorNodeTransaction[];
};

export function formatBatchShowOutput(payload: BatchShowPayload): string {
  const { manifest, outerTransaction, innerTransactions } = payload;
  const lines: string[] = [
    `${formatManifestStatus(manifest.meta.status)} ${ansi.bold(manifest.meta.batchId)}`,
    `${ansi.slate("├─")} network: ${manifest.meta.network} ${sourceLocal()}`,
    `${ansi.slate("├─")} created: ${manifest.meta.createdAt} ${sourceLocal()}`,
    `${ansi.slate("├─")} updated: ${manifest.meta.updatedAt} ${sourceLocal()}`,
    `${ansi.slate("├─")} root locator: ${manifest.execution.outerTransaction?.transactionId ?? "n/a"} ${sourceExecute()}`,
    `${ansi.slate("├─")} child locators: ${manifest.execution.innerTransactions.length} ${sourceExecute()}`,
    `${ansi.slate("├─")} local artifacts: account create, token create, hbar transfer ${sourceLocal()}`,
  ];

  if (outerTransaction) {
    lines.push(`${ansi.slate("└─")} ${formatRootTransaction(outerTransaction)}`);

    for (const [index, transaction] of innerTransactions.entries()) {
      const isLastChild = index === innerTransactions.length - 1;
      const branch = isLastChild ? "   └─" : "   ├─";
      const artifactLabel = findArtifactLabel(manifest, transaction.transaction_id, transaction.nonce);
      const guide = isLastChild ? "  " : "│ ";

      // We join local-only artifacts with Mirror Node data by txId + nonce.
      // This makes the tree readable without persisting large chain payloads locally.
      lines.push(`${ansi.slate(branch)} ${formatChildTransaction(transaction)}`);
      lines.push(`   ${guide}  ${ansi.slate("├─")} context: ${ansi.mist(artifactLabel)} ${sourceLocal()}`);
      lines.push(`   ${guide}  ${ansi.slate("├─")} entity: ${transaction.entity_id ?? "n/a"} ${sourceMirror()}`);
      lines.push(`   ${guide}  ${ansi.slate("├─")} fee: ${transaction.charged_tx_fee} ${sourceMirror()}`);
      lines.push(`   ${guide}  ${ansi.slate("├─")} consensus: ${transaction.consensus_timestamp} ${sourceMirror()}`);
      lines.push(`   ${guide}  ${ansi.slate("├─")} hbar: ${formatTransfers(transaction.transfers)} ${sourceMirror()}`);
      lines.push(`   ${guide}  ${ansi.slate("├─")} token: ${formatTokenTransfers(transaction.token_transfers)} ${sourceMirror()}`);
      lines.push(`   ${guide}  ${ansi.slate("└─")} nft: ${formatNftTransfers(transaction.nft_transfers)} ${sourceMirror()}`);
    }
  } else {
    lines.push(`${ansi.slate("└─")} root: ${ansi.dim("not available")}`);
  }

  lines.push("");
  lines.push(ansi.bold("🧩 Local Artifacts"));
  lines.push(`- account key: ${manifest.artifacts.accountCreation.generatedPrivateKey} ${sourceLocal()}`);
  lines.push(`- account evm: ${manifest.artifacts.accountCreation.evmAddress} ${sourceLocal()}`);
  lines.push(`- token admin key: ${manifest.artifacts.tokenCreation.adminPrivateKey} ${sourceLocal()}`);
  lines.push(`- token supply key: ${manifest.artifacts.tokenCreation.supplyPrivateKey} ${sourceLocal()}`);
  lines.push(`- planned transfer: ${manifest.artifacts.hbarTransfer.senderAccountId} -> ${manifest.artifacts.hbarTransfer.recipientAccountId} | ${manifest.artifacts.hbarTransfer.amountHbar} ${sourceLocal()}`);

  lines.push("");
  lines.push(ansi.bold("🗺 Legend"));
  lines.push(`- ${sourceMirror()} fetched live from ${ansi.cyan("Mirror Node")}`);
  lines.push(`- ${sourceExecute()} captured from execute response / transaction object`);
  lines.push(`- ${sourceLocal()} persisted local metadata from batch manifest`);

  if (manifest.error) {
    lines.push("");
    lines.push(`${ansi.red("💥 Stored error")}: ${manifest.error.message} ${sourceLocal()}`);
  }

  return lines.join("\n");
}

function formatManifestStatus(status: BatchManifest["meta"]["status"]): string {
  switch (status) {
    case "executed":
      return ansi.green("✅ executed");
    case "pending":
      return ansi.yellow("🟡 pending");
    case "failed":
      return ansi.red("❌ failed");
  }
}

function formatRootTransaction(transaction: MirrorNodeTransaction): string {
  return `${ansi.bold("🌳 root")} ${ansi.cyan(transaction.transaction_id)} ${ansi.slate(`nonce=${transaction.nonce}`)} ${formatMirrorResult(transaction.result)} ${ansi.blue(transaction.name)} ${sourceMirror()}`;
}

function formatChildTransaction(transaction: MirrorNodeTransaction): string {
  return `${ansi.bold("↳ child")} ${ansi.cyan(transaction.transaction_id)} ${ansi.slate(`nonce=${transaction.nonce}`)} ${formatMirrorResult(transaction.result)} ${ansi.blue(transaction.name)} ${sourceMirror()}`;
}

function formatMirrorResult(result: string): string {
  return result === "SUCCESS" ? ansi.green(result) : ansi.red(result);
}

function sourceMirror(): string {
  return ansi.ice("🪞 mirror");
}

function sourceExecute(): string {
  return ansi.cyan("⚙ execute");
}

function sourceLocal(): string {
  return ansi.mist("💾 local");
}

function findArtifactLabel(manifest: BatchManifest, transactionId: string, nonce: number): string {
  if (matchesLocator(manifest.artifacts.accountCreation.sourceTransaction, transactionId, nonce)) {
    return "account creation";
  }

  if (matchesLocator(manifest.artifacts.tokenCreation.sourceTransaction, transactionId, nonce)) {
    return "token creation";
  }

  if (matchesLocator(manifest.artifacts.hbarTransfer.sourceTransaction, transactionId, nonce)) {
    return "hbar transfer";
  }

  return "unmapped";
}

function matchesLocator(
  locator: BatchManifest["execution"]["innerTransactions"][number] | null,
  transactionId: string,
  nonce: number,
): boolean {
  return locator?.transactionId === transactionId && locator.nonce === nonce;
}

function formatTransfers(transfers: ReadonlyArray<{ account: string; amount: number }>): string {
  if (transfers.length === 0) {
    return "none";
  }

  return transfers.map((transfer) => `${transfer.account}:${transfer.amount}`).join(", ");
}

function formatTokenTransfers(transfers: ReadonlyArray<{ token_id: string; account: string; amount: number }>): string {
  if (transfers.length === 0) {
    return "none";
  }

  return transfers.map((transfer) => `${transfer.token_id}:${transfer.account}:${transfer.amount}`).join(", ");
}

function formatNftTransfers(
  transfers: ReadonlyArray<{ token_id: string; serial_number: number; sender_account_id: string | null; receiver_account_id: string | null }>,
): string {
  if (transfers.length === 0) {
    return "none";
  }

  return transfers
    .map((transfer) => `${transfer.token_id}#${transfer.serial_number}:${transfer.sender_account_id ?? "n/a"}->${transfer.receiver_account_id ?? "n/a"}`)
    .join(", ");
}
