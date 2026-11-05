"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { erc20Abi, parseAbi, parseEventLogs, zeroAddress, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { displayAmount, parseTokenAmount } from "@/lib/amounts";
import { wrapperAbi } from "@/lib/contracts/wrapperAbi";
import { encryptAmount } from "@/lib/zama/encryption";
import { decryptAmount, publicDecryptWithdrawal } from "@/lib/zama/decryption";
import type { WorkshopSession } from "./use-workshop-session";

const faucetAbi = parseAbi(["function faucet()"]);

export function useAssets(session: WorkshopSession) {
  const [amountInput, setAmountInput] = useState("");
  const [shieldToPayroll, setShieldToPayroll] = useState(true);
  const [confidentialBalance, setConfidentialBalance] = useState<string>();
  const [withdrawalId, setWithdrawalId] = useState("");

  const balanceQuery = useQuery({
    queryKey: ["public-balance", session.account.address, session.deployment?.publicToken],
    enabled: session.ready,
    queryFn: async () => {
      const { publicClient, address, deployment } = session.requireSession();
      return publicClient.readContract({
        address: deployment.publicToken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
    },
  });

  function faucet() {
    return session.runTask(async () => {
      const { walletClient, address, deployment } = session.requireSession();
      session.setStatus("Waiting for wallet… Claim valueless workshop tokens.");
      await session.confirmTransaction(
        await walletClient.writeContract({
          chain: sepolia,
          account: address,
          address: deployment.publicToken,
          abi: faucetAbi,
          functionName: "faucet",
        }),
      );
      return "Practice wUSD received. These tokens have no monetary value.";
    });
  }

  function viewBalance() {
    return session.runTask(async () => {
      const { publicClient, address, deployment } = session.requireSession();
      const handle = await publicClient.readContract({
        address: deployment.wrapper,
        abi: wrapperAbi,
        functionName: "confidentialBalanceOf",
        args: [address],
      });
      session.setStatus("Decrypting your confidential balance…");
      const balance = await decryptAmount(await session.getSdk(), deployment.wrapper, handle);
      setConfidentialBalance(displayAmount(balance));
      return "Your confidential balance is visible in this browser session.";
    });
  }

  function shield() {
    return session.runTask(async () => {
      const { walletClient, publicClient, address, deployment } = session.requireSession();
      const amount = parseTokenAmount(amountInput);
      const balance = await publicClient.readContract({
        address: deployment.publicToken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
      if (amount > balance)
        throw new Error("Insufficient public wUSD. Claim practice tokens first.");
      session.setStatus("Waiting for wallet… Approve the exact public token amount.");
      await session.confirmTransaction(
        await walletClient.writeContract({
          chain: sepolia,
          account: address,
          address: deployment.publicToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.wrapper, amount],
        }),
      );
      session.setStatus("Waiting for wallet… Shield approved tokens.");
      // @workshop:start 13
      const recipient = shieldToPayroll ? deployment.payroll : address;
      await session.confirmTransaction(
        await walletClient.writeContract({
          chain: sepolia,
          account: address,
          address: deployment.wrapper,
          abi: wrapperAbi,
          functionName: "wrap",
          args: [recipient, amount],
        }),
      );
      // @workshop:end 13
      setConfidentialBalance(undefined);
      setAmountInput("");
      return shieldToPayroll
        ? "Payroll treasury funded. The shield amount is public; subsequent payroll transfers are confidential."
        : "Tokens shielded to your wallet. View your confidential balance when ready.";
    });
  }

  function requestUnshield() {
    return session.runTask(async () => {
      const { walletClient, publicClient, address, deployment } = session.requireSession();
      const amount = parseTokenAmount(amountInput);
      session.setStatus("Checking your confidential balance privately…");
      const sdk = await session.getSdk();
      const balanceHandle = await publicClient.readContract({
        address: deployment.wrapper,
        abi: wrapperAbi,
        functionName: "confidentialBalanceOf",
        args: [address],
      });
      if ((await decryptAmount(sdk, deployment.wrapper, balanceHandle)) < amount)
        throw new Error("Insufficient confidential token balance.");
      session.setStatus("Encrypting withdrawal amount…");
      const encrypted = await encryptAmount(sdk, deployment.wrapper, address, amount);
      session.setStatus("Waiting for wallet… Request unshield.");
      const receipt = await session.confirmTransaction(
        await walletClient.writeContract({
          chain: sepolia,
          account: address,
          address: deployment.wrapper,
          abi: wrapperAbi,
          functionName: "unwrap",
          args: [address, address, encrypted.encryptedValue, encrypted.inputProof],
        }),
      );
      const events = parseEventLogs({
        abi: wrapperAbi,
        eventName: "UnwrapRequested",
        logs: receipt.logs.filter(
          (log) => log.address.toLowerCase() === deployment.wrapper.toLowerCase(),
        ),
      });
      const requestId = events[0]?.args.unwrapRequestId;
      if (!requestId)
        throw new Error(
          "Unshield transaction confirmed, but its request ID was not found. Recover it from UnwrapRequested in the transaction receipt.",
        );
      setWithdrawalId(requestId);
      setConfidentialBalance(undefined);
      setAmountInput("");
      return "Unshield requested. Copy the public request ID; finalize when decryption is ready. The withdrawal amount becomes public.";
    });
  }

  function finalizeUnshield() {
    return session.runTask(async () => {
      const { walletClient, publicClient, address, deployment } = session.requireSession();
      if (!/^0x[0-9a-fA-F]{64}$/.test(withdrawalId))
        throw new Error("Enter the bytes32 request ID from UnwrapRequested.");
      const requestId = withdrawalId as Hex;
      const receiver = await publicClient.readContract({
        address: deployment.wrapper,
        abi: wrapperAbi,
        functionName: "unwrapRequester",
        args: [requestId],
      });
      if (receiver === zeroAddress)
        throw new Error("This unshield request is unknown or already finalized.");
      session.setStatus(
        "Waiting for public withdrawal decryption… Retry finalize later if the Relayer is still processing.",
      );
      // @workshop:start 14
      const result = await publicDecryptWithdrawal(await session.getSdk(), requestId);
      const clearAmount = result.clearValues[requestId];
      if (typeof clearAmount !== "bigint")
        throw new Error("Withdrawal amount is not available yet.");
      session.setStatus("Waiting for wallet… Finalize unshield.");
      await session.confirmTransaction(
        await walletClient.writeContract({
          chain: sepolia,
          account: address,
          address: deployment.wrapper,
          abi: wrapperAbi,
          functionName: "finalizeUnwrap",
          args: [requestId, clearAmount, result.decryptionProof],
        }),
      );
      // @workshop:end 14
      setWithdrawalId("");
      return "Unshield finalized. Public wUSD has been released to the request's recorded receiver.";
    });
  }

  return {
    amountInput,
    setAmountInput,
    shieldToPayroll,
    setShieldToPayroll,
    publicBalance: balanceQuery.data === undefined ? undefined : displayAmount(balanceQuery.data),
    publicBalanceError: balanceQuery.error,
    confidentialBalance,
    withdrawalId,
    setWithdrawalId,
    faucet,
    viewBalance,
    shield,
    requestUnshield,
    finalizeUnshield,
  };
}

export type AssetControls = ReturnType<typeof useAssets>;
