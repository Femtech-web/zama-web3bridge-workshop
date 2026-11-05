import { formatUnits, parseUnits } from "viem";
import { TOKEN_DECIMALS } from "./config";

export function parseTokenAmount(input: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(input))
    throw new Error("Enter a positive amount with at most 6 decimal places.");
  const amount = parseUnits(input, TOKEN_DECIMALS);
  if (amount <= 0n || amount > (1n << 64n) - 1n)
    throw new Error("Amount must be positive and fit in uint64 token units.");
  return amount;
}

export function displayAmount(amount: bigint): string {
  return formatUnits(amount, TOKEN_DECIMALS);
}

export function parsePeriod(input: string): bigint {
  if (!/^\d{6}$/.test(input) || Number(input.slice(4)) < 1 || Number(input.slice(4)) > 12)
    throw new Error("Use a payroll period in YYYYMM format, for example 202611.");
  return BigInt(input);
}
