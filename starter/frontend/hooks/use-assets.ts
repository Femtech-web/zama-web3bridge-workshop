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
        blockNumber: await session.readBlockNumber(),
        address: deployment.wrapper,
        abi: wrapperAbi,
        functionName: "confidentialBalanceOf",
        args: [address],
      });
      session.setStatus("Decrypting your confidential balance…");
      const balance = await decryptAmount(await session.getSdk(), deployment.wrapper, handle);
      setConfidentialBalance(displayAmount(balance));
      return "Your shielded balance is visible. Hide it when finished.";
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
      // TODO 13: Shield through the official ERC-20 wrapper (prepared demonstration).
      // Docs: https://docs.openzeppelin.com/confidential-contracts/token
      throw new Error("Complete TODO 13 or restore the prepared shield checkpoint.");
      // @workshop:end 13
      setConfidentialBalance(undefined);
      setAmountInput("");
      return shieldToPayroll
        ? "Tokens shielded to payroll for employee payments."
        : "Tokens shielded to your wallet. Use View balance in Assets to see them privately.";
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
      // TODO 14: Verify public withdrawal decryption and finalize (prepared demonstration).
      // Docs: https://docs.openzeppelin.com/confidential-contracts/api/token
      throw new Error("Complete TODO 14 or restore the prepared unshield checkpoint.");
      // @workshop:end 14
      setWithdrawalId("");
      return "Unshield finalized. Public wUSD has been released to the request's recorded receiver.";
    });
  }

  return {
    walletAddress: session.account.address,
    amountInput,
    setAmountInput,
    shieldToPayroll,
    setShieldToPayroll,
    shieldRecipient: shieldToPayroll ? session.deployment?.payroll : session.account.address,
    publicBalance: balanceQuery.data === undefined ? undefined : displayAmount(balanceQuery.data),
    publicBalanceError: balanceQuery.error,
    confidentialBalance,
    hideBalance: () => setConfidentialBalance(undefined),
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
