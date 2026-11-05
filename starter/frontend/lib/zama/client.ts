import type { ZamaSDK } from "@zama-fhe/sdk";
import type { PublicClient, WalletClient } from "viem";

export async function createZamaClient(
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<ZamaSDK> {
  if (typeof window === "undefined")
    throw new Error("FHE encryption must initialize in the browser.");
  // @workshop:start 8
  // TODO 8: Initialize the current SDK's Sepolia browser transport.
  // Docs: https://docs.zama.org/protocol/sdk/guides/configuration
  throw new Error("Complete TODO 8: initialize the browser SDK.");
  // @workshop:end 8
}
