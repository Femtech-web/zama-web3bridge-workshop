import type { ZamaSDK } from "@zama-fhe/sdk";
import type { Address, Hex } from "viem";

export async function encryptAmount(
  sdk: ZamaSDK,
  contractAddress: Address,
  senderAddress: Address,
  amount: bigint,
): Promise<{ encryptedValue: Hex; inputProof: Hex }> {
  if (amount < 0n || amount > (1n << 64n) - 1n)
    throw new Error("Amount must fit in an unsigned 64-bit integer.");
  // @workshop:start 9
  const encrypted = await sdk.encrypt({
    values: [{ value: amount, type: "euint64" }],
    contractAddress,
    userAddress: senderAddress,
  });
  const encryptedValue = encrypted.encryptedValues[0];
  if (!encryptedValue) throw new Error("Encryption returned no salary handle.");
  return { encryptedValue, inputProof: encrypted.inputProof };
  // @workshop:end 9
}
