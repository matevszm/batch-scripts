import { AccountId, Client, PrivateKey } from "@hashgraph/sdk";
import type { HederaNetworkName } from "./config.js";

type OperatorKeyType = "ecdsa" | "ed25519" | "der";

export type HederaClientContext = {
  readonly client: Client;
  readonly operatorId: AccountId;
  readonly operatorKey: PrivateKey;
};

export function createHederaClient(network: HederaNetworkName): HederaClientContext {
  const operatorId = AccountId.fromString(requireEnv("OPERATOR_ID"));
  const operatorKey = parseOperatorKey(
    requireEnv("OPERATOR_KEY"),
    readOptionalOperatorKeyType(process.env.OPERATOR_KEY_TYPE),
  );
  const client = createNetworkClient(network).setOperator(operatorId, operatorKey);

  return { client, operatorId, operatorKey };
}

function parseOperatorKey(value: string, keyType: OperatorKeyType | null): PrivateKey {
  const normalizedValue = normalizeKeyValue(value);

  if (keyType === "der") {
    return PrivateKey.fromStringDer(normalizedValue);
  }

  if (keyType === "ecdsa") {
    return PrivateKey.fromStringECDSA(normalizedValue);
  }

  if (keyType === "ed25519") {
    return PrivateKey.fromStringED25519(normalizedValue);
  }

  if (looksLikePem(normalizedValue)) {
    throw new Error("PEM operator keys are not supported here. Use DER hex or raw hex with OPERATOR_KEY_TYPE.");
  }

  if (looksLikeHex(normalizedValue) && PrivateKey.isDerKey(normalizedValue)) {
    return PrivateKey.fromStringDer(normalizedValue);
  }

  if (looksLikeRawHexPrivateKey(normalizedValue)) {
    throw new Error(
      "Ambiguous OPERATOR_KEY format. Set OPERATOR_KEY_TYPE to ecdsa or ed25519 for raw hex private keys.",
    );
  }

  return PrivateKey.fromString(normalizedValue);
}

function readOptionalOperatorKeyType(value: string | undefined): OperatorKeyType | null {
  if (!value) {
    return null;
  }

  switch (value.trim().toLowerCase()) {
    case "ecdsa":
      return "ecdsa";
    case "ed25519":
      return "ed25519";
    case "der":
      return "der";
    default:
      throw new Error("Invalid OPERATOR_KEY_TYPE. Supported values: ecdsa, ed25519, der.");
  }
}

function looksLikePem(value: string): boolean {
  return value.includes("BEGIN PRIVATE KEY") || value.includes("BEGIN EC PRIVATE KEY");
}

function looksLikeHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value);
}

function looksLikeRawHexPrivateKey(value: string): boolean {
  return looksLikeHex(value) && value.length === 64;
}

function normalizeKeyValue(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("0x") || trimmedValue.startsWith("0X")) {
    return trimmedValue.slice(2);
  }

  return trimmedValue;
}

function requireEnv(name: "OPERATOR_ID" | "OPERATOR_KEY"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createNetworkClient(network: HederaNetworkName): Client {
  switch (network) {
    case "testnet":
      return Client.forTestnet();
  }
}
