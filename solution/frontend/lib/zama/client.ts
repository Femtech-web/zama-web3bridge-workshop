import type { ZamaSDK } from "@zama-fhe/sdk";
import type { PublicClient, WalletClient } from "viem";

export async function createZamaClient(
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<ZamaSDK> {
  if (typeof window === "undefined")
    throw new Error("FHE encryption must initialize in the browser.");
  // @workshop:start 8
  const [{ ZamaSDK, MemoryStorage }, { createConfig }, { web }, { sepolia }] = await Promise.all([
    import("@zama-fhe/sdk"),
    import("@zama-fhe/sdk/viem"),
    import("@zama-fhe/sdk/web"),
    import("@zama-fhe/sdk/chains"),
  ]);
  return new ZamaSDK(
    createConfig({
      chains: [sepolia],
      publicClient,
      walletClient,
      relayers: { [sepolia.id]: web() },
      storage: new MemoryStorage(),
      permitTTL: 1,
      telemetry: false,
    }),
  );
  // @workshop:end 8
}
