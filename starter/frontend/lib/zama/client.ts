import type { ZamaSDK } from "@zama-fhe/sdk";
import type { PublicClient, WalletClient } from "viem";

export async function createZamaClient(
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<ZamaSDK> {
  if (typeof window === "undefined")
    throw new Error("FHE encryption must initialize in the browser.");
  // Slide 11, Part 1 | Step 8: Configure the browser SDK.
  // @workshop:start 8
  // TODO 8: Initialize the Sepolia browser SDK with the connected wallet and memory storage.
  // Docs: https://docs.zama.org/protocol/sdk/guides/configuration
  throw new Error("Complete TODO 8: initialize the browser SDK.");
  // @workshop:end 8
}
