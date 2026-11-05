import type { ZamaSDK } from "@zama-fhe/sdk";
import type { Address, Hex } from "viem";
import { zeroHash } from "viem";

export async function decryptAmount(
  sdk: ZamaSDK,
  contractAddress: Address,
  encryptedValue: Hex,
): Promise<bigint> {
  if (encryptedValue === zeroHash) return 0n;
  // @workshop:start 11
  const values = await sdk.decryption.decryptValues([{ encryptedValue, contractAddress }]);
  const amount = values[encryptedValue];
  if (typeof amount !== "bigint") throw new Error("The Relayer did not return a valid amount.");
  return amount;
  // @workshop:end 11
}

export async function publicDecryptWithdrawal(sdk: ZamaSDK, encryptedAmount: Hex) {
  return sdk.decryption.decryptPublicValues([encryptedAmount]);
}
