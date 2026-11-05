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
  return walletClient.writeContract({
    chain: sepolia,
    account: sender,
    address: payrollAddress,
    abi: payrollAbi,
    functionName: action,
    args: [employee, encryptedValue, inputProof],
  });
  // @workshop:end 10
}
