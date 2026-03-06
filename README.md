# Hedera Batch CLI

Small CLI for testing Hedera batch transactions with persistent local history and live Mirror Node inspection.

## What it does

This project executes one demo Hedera batch transaction containing:

- account creation
- fungible token creation in HTS
- HBAR transfer

The CLI is intentionally built as a small testing tool, not a generic framework.

## Main functionality

### `batch execute`

Builds and executes a demo `BatchTransaction` through the Hedera SDK.

What gets executed in one batch:

- create a new account
- create a fungible token
- transfer HBAR

What gets stored locally after execution:

- batch id
- execution timestamps
- outer transaction locator
- child transaction locators (`transactionId + nonce`)
- local metadata that cannot be recovered from Mirror Node
- generated keys for the created account and token roles

The stored data is kept intentionally small. Heavy transaction details are not cached locally when they can be fetched later from Mirror Node.

### `batch list`

Shows all batch executions created by this CLI.

The view includes:

- execution status
- local batch id
- root transaction id
- number of child transactions
- execution timestamp

### `batch show <batchId>`

Shows a detailed tree view of one executed batch.

It combines 3 data sources:

- local manifest stored on disk
- execute-time transaction locators captured by the CLI
- live transaction details fetched from Hedera Mirror Node

The output makes it clear:

- which transaction is the root batch transaction
- which transactions are child transactions
- which child corresponds to account creation, token creation, or HBAR transfer
- which data comes from local metadata vs execute response vs Mirror Node

## Local storage

Batch history is stored in:

```text
.batch-history/
```

Structure:

```text
.batch-history/
  index.json
  batches/
    <batchId>.json
```

The local manifest is the source of truth for batch-specific metadata. Mirror Node is used as the source of truth for transaction details that can be fetched on demand.

## Requirements

Environment variables:

```env
OPERATOR_ID=0.0.x
OPERATOR_KEY=...
OPERATOR_KEY_TYPE=der
```

`OPERATOR_KEY_TYPE` supports:

- `der`
- `ecdsa`
- `ed25519`

## Commands

```bash
pnpm start -- batch execute
pnpm start -- batch list
pnpm start -- batch show <batchId>
```

## Notes

- this is a purpose-built CLI for batch transaction testing
- `batch show` depends on Mirror Node availability
- local manifests intentionally keep only useful durable metadata
- generated keys are persisted locally for test workflows, not for production security
