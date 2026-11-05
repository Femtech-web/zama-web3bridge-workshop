import type { Metadata } from "next";
import localFont from "next/font/local";
import { Web3Provider } from "@/components/web3-provider";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Confidential Payroll · Zama × Web3Bridge",
  description: "Build confidential onchain payroll with Zama and ERC-7984.",
};

const neueMontreal = localFont({
  src: [
    { path: "./fonts/PPNeueMontreal-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PPNeueMontreal-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PPNeueMontreal-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-neue-montreal",
  display: "swap",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={neueMontreal.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to payroll
        </a>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
