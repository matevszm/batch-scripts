import { Hbar } from "@hashgraph/sdk";
import { resolve } from "node:path";

export type HederaNetworkName = "testnet";

export type DemoBatchConfig = {
  readonly transferRecipientAccountId: string;
  readonly createdAccountInitialBalanceHbar: string;
  readonly hbarTransferAmountHbar: string;
  readonly tokenName: string;
  readonly tokenSymbol: string;
  readonly tokenDecimals: number;
  readonly tokenInitialSupply: number;
  readonly tokenMaxSupply: number;
  readonly tokenMemo: string;
};

export type AppConfig = {
  readonly network: HederaNetworkName;
  readonly storageDirectoryPath: string;
  readonly cliVersion: string;
  readonly mirrorNodeBaseUrl: string;
  readonly demoBatch: DemoBatchConfig;
};

const DEFAULT_STORAGE_DIRECTORY = ".batch-history";

export function getAppConfig(): AppConfig {
  return {
    network: "testnet",
    storageDirectoryPath: resolve(process.cwd(), DEFAULT_STORAGE_DIRECTORY),
    cliVersion: "1.0.0",
    mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com/api/v1",
    demoBatch: {
      transferRecipientAccountId: "0.0.5005",
      createdAccountInitialBalanceHbar: formatHbar(new Hbar(5)),
      hbarTransferAmountHbar: formatHbar(new Hbar(2)),
      tokenName: "Batch Demo Token",
      tokenSymbol: "BDT",
      tokenDecimals: 2,
      tokenInitialSupply: 100_000,
      tokenMaxSupply: 100_000,
      tokenMemo: "Created from Hedera batch demo",
    },
  };
}

function formatHbar(value: Hbar): string {
  return value.toString();
}
