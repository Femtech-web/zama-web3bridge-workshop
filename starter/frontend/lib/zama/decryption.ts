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
  // TODO 11: Request authorized user decryption on a button click.
  // Docs: https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt
  throw new Error("Complete TODO 11: decrypt with the connected user permit.");
  // @workshop:end 11
}

export async function publicDecryptWithdrawal(sdk: ZamaSDK, encryptedAmount: Hex) {
  return sdk.decryption.decryptPublicValues([encryptedAmount]);
}
