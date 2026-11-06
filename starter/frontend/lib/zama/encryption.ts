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
  // Slide 11, Part 2 | Step 9: Encrypt the salary.
  // @workshop:start 9
  // TODO 9: Encrypt the amount for this payroll contract and connected employer.
  // Docs: https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt
  throw new Error("Complete TODO 9: encrypt the amount and obtain its input proof.");
  // @workshop:end 9
}
