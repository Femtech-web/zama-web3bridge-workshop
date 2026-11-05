import { sepolia } from "viem/chains";
import type { Address, Hex, WalletClient } from "viem";
import { payrollAbi } from "./payrollAbi";

export function writeSalary(
  walletClient: WalletClient,
  sender: Address,
  payrollAddress: Address,
  employee: Address,
  action: "setSalary" | "addBonus",
  encryptedValue: Hex,
  inputProof: Hex,
): Promise<Hex> {
  // @workshop:start 10
  // TODO 10: Write employee, encrypted value, and proof with Viem.
  // Docs: https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt
  throw new Error("Complete TODO 10: submit the encrypted salary arguments.");
  // @workshop:end 10
}
