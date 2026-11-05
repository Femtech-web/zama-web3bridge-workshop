"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Hex } from "viem";
import { SEPOLIA_CHAIN_ID, validateDeployment } from "@/lib/config";
import { createZamaClient } from "@/lib/zama/client";
import { friendlyError } from "@/lib/errors";

export function useWorkshopSession() {
  const account = useAccount();
  const publicClient = usePublicClient({ chainId: SEPOLIA_CHAIN_ID });
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const deploymentQuery = useQuery({
    queryKey: ["deployment"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/zama/config", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          "Sepolia deployment is not configured. Follow the setup instructions in the README.",
        );
      return validateDeployment(body);
    },
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Connect a wallet to begin.");
  const [error, setError] = useState<string>();
  const [transactionHash, setTransactionHash] = useState<Hex>();
  const inFlight = useRef(false);
  const sdkCache = useRef<{
    accountKey: string;
    promise: ReturnType<typeof createZamaClient>;
  } | null>(null);

  useEffect(
    () => () => {
      const cached = sdkCache.current;
      sdkCache.current = null;
      void cached?.promise.then((sdk) => sdk.terminate()).catch(() => undefined);
    },
    [],
  );

  function requireSession() {
    const deployment = deploymentQuery.data;
    if (!account.address || !walletClient) throw new Error("Connect a wallet first.");
    if (account.chainId !== SEPOLIA_CHAIN_ID)
      throw new Error("Switch your wallet to Sepolia to continue.");
    if (!deployment) throw new Error("Configure a real Sepolia deployment first.");
    if (!publicClient) throw new Error("Sepolia RPC client is unavailable.");
    return { address: account.address, walletClient, publicClient, deployment };
  }

  async function getSdk() {
    const session = requireSession();
    const accountKey = `${session.address}:${account.chainId}`;
    if (sdkCache.current?.accountKey !== accountKey) {
      const promise = createZamaClient(session.publicClient, session.walletClient).catch(
        (sdkError: unknown) => {
          sdkCache.current = null;
          throw sdkError;
        },
      );
      sdkCache.current = { accountKey, promise };
    }
    return sdkCache.current.promise;
  }

  async function confirmTransaction(hash: Hex) {
    const session = requireSession();
    setTransactionHash(hash);
    setStatus("Transaction submitted. Confirming on Sepolia…");
    const receipt = await session.publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 120_000,
    });
    if (receipt.status !== "success") throw new Error("The contract transaction reverted.");
    return receipt;
  }

  async function runTask(action: () => Promise<string>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(undefined);
    setTransactionHash(undefined);
    try {
      requireSession();
      const result = await action();
      setStatus(result);
    } catch (actionError) {
      setError(friendlyError(actionError));
      setStatus("Action needs attention.");
    } finally {
      inFlight.current = false;
      setBusy(false);
      await queryClient.invalidateQueries({ queryKey: ["public-balance"] });
    }
  }

  return {
    account,
    deployment: deploymentQuery.data,
    deploymentError: deploymentQuery.error,
    loadingDeployment: deploymentQuery.isPending,
    retryDeployment: deploymentQuery.refetch,
    busy,
    status,
    error,
    transactionHash,
    setStatus,
    requireSession,
    getSdk,
    confirmTransaction,
    runTask,
    ready: Boolean(account.address && account.chainId === SEPOLIA_CHAIN_ID && deploymentQuery.data),
    isEmployer: account.address?.toLowerCase() === deploymentQuery.data?.employer.toLowerCase(),
  };
}

export type WorkshopSession = ReturnType<typeof useWorkshopSession>;
