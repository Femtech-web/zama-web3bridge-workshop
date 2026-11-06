"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { zeroHash, type Address, type Hex } from "viem";
import { displayAmount } from "@/lib/amounts";
import { payrollAbi } from "@/lib/contracts/payrollAbi";
import { decryptAmount } from "@/lib/zama/decryption";
import type { WorkshopSession } from "./use-workshop-session";

// Slide 14 | Prepared demo: let the employer view payroll's shielded balance.
export function useTreasuryBalance(session: WorkshopSession) {
  const [revealed, setRevealed] = useState<{ payroll: Address; handle: Hex; amount: string }>();
  const supported = session.deployment?.treasuryViewing === true;
  const balanceQuery = useQuery({
    queryKey: ["treasury-balance", session.deployment?.payroll],
    enabled: session.ready && session.isEmployer && supported,
    queryFn: async () => {
      const { publicClient, deployment } = session.requireSession();
      return publicClient.readContract({
        blockNumber: await session.readBlockNumber(),
        address: deployment.payroll,
        abi: payrollAbi,
        functionName: "treasuryBalance",
      });
    },
  });

  async function readBalance() {
    const { data } = await balanceQuery.refetch({ throwOnError: true });
    if (!data) throw new Error("Payroll balance is unavailable. Please retry.");
    return data;
  }

  function viewBalance() {
    return session.runTask(async () => {
      const { address, walletClient, deployment } = session.requireSession();
      if (!session.isEmployer)
        throw new Error("Connect the employer wallet to view payroll funds.");
      if (!supported) throw new Error("This earlier payroll does not support balance viewing.");
      setRevealed(undefined);
      let [handle, canView] = await readBalance();
      if (!canView) {
        session.setStatus("Waiting for wallet… Authorize private viewing of payroll's balance.");
        await session.confirmTransaction(
          await walletClient.writeContract({
            chain: sepolia,
            account: address,
            address: deployment.payroll,
            abi: payrollAbi,
            functionName: "allowTreasuryBalanceViewing",
          }),
        );
        [handle, canView] = await readBalance();
        if (!canView)
          throw new Error("Payroll's balance changed while authorizing. Click View balance again.");
      }
      session.setStatus("Decrypting payroll's balance privately for the employer…");
      const amount =
        handle === zeroHash
          ? 0n
          : await decryptAmount(await session.getSdk(), deployment.wrapper, handle);
      setRevealed({ payroll: deployment.payroll, handle, amount: displayAmount(amount) });
      return "Payroll's balance is visible to the employer. Hide it when finished.";
    });
  }

  return {
    isEmployer: session.isEmployer,
    supported,
    error: balanceQuery.error,
    balance:
      revealed?.payroll === session.deployment?.payroll &&
      revealed?.handle === balanceQuery.data?.[0]
        ? revealed?.amount
        : undefined,
    viewBalance,
    hideBalance: () => setRevealed(undefined),
  };
}

export type TreasuryControls = ReturnType<typeof useTreasuryBalance>;
