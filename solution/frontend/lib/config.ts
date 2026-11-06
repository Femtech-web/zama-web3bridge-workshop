import { getAddress, isAddress, zeroAddress, type Address } from "viem";

export const SEPOLIA_CHAIN_ID = 11155111;
export const TOKEN_DECIMALS = 6;

export type Deployment = {
  chainId: number;
  employer: Address;
  payroll: Address;
  publicToken: Address;
  wrapper: Address;
  treasuryViewing: boolean;
  previousPayroll?: Address;
};

export function validateDeployment(value: unknown): Deployment {
  if (!value || typeof value !== "object") throw new Error("Deployment configuration is missing.");
  const candidate = value as Record<string, unknown>;
  if (candidate.chainId !== SEPOLIA_CHAIN_ID)
    throw new Error(
      "This frontend supports Sepolia only. Use Hardhat tests for local confidential logic.",
    );
  function address(field: string): Address {
    const result = candidate[field];
    if (typeof result !== "string" || !isAddress(result) || result === zeroAddress) {
      throw new Error(`Deployment field ${field} must be a valid, nonzero address.`);
    }
    return getAddress(result);
  }
  return {
    chainId: SEPOLIA_CHAIN_ID,
    employer: address("employer"),
    payroll: address("payroll"),
    publicToken: address("publicToken"),
    wrapper: address("wrapper"),
    treasuryViewing: candidate.treasuryViewing === true,
    previousPayroll:
      candidate.previousPayroll === undefined ? undefined : address("previousPayroll"),
  };
}
