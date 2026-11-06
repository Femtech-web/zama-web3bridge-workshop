"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, connectorsForWallets, lightTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";

const walletTheme = lightTheme({
  accentColor: "#191b18",
  accentColorForeground: "#ffffff",
  borderRadius: "small",
});
walletTheme.fonts.body = "var(--font-neue-montreal), sans-serif";

// Slide 11, Part 1 | Prepared setup: wallet connection and Sepolia chain reads.
function createWalletConfig() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
  const connectors = connectorsForWallets(
    [
      {
        groupName: "Connect to the workshop",
        wallets: projectId ? [injectedWallet, walletConnectWallet] : [injectedWallet],
      },
    ],
    { appName: "Confidential Payroll · Zama × Web3Bridge", projectId },
  );
  return createConfig({
    chains: [sepolia],
    connectors,
    transports: { [sepolia.id]: http("/api/rpc") },
    ssr: true,
  });
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [walletConfig] = useState(createWalletConfig);
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }),
  );
  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={walletTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
