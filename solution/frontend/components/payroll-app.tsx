"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain } from "wagmi";
import { useWorkshopSession } from "@/hooks/use-workshop-session";
import { usePayroll } from "@/hooks/use-payroll";
import { useAssets } from "@/hooks/use-assets";
import { SEPOLIA_CHAIN_ID } from "@/lib/config";
import { EmployerPanel } from "./employer-panel";
import { EmployeePanel } from "./employee-panel";
import { AssetsPanel } from "./assets-panel";

function ConnectedWorkspace() {
  const session = useWorkshopSession();
  const payroll = usePayroll(session);
  const assets = useAssets(session);
  const { switchChain, isPending: switchingChain } = useSwitchChain();
  const wrongNetwork = Boolean(
    session.account.address && session.account.chainId !== SEPOLIA_CHAIN_ID,
  );
  const disabled = !session.ready || session.busy;

  return (
    <>
      {session.loadingDeployment && (
        <div className="notice" role="status">
          Checking Sepolia deployment…
        </div>
      )}
      {session.deploymentError && (
        <div className="notice">
          <strong>Ready for your Sepolia deployment.</strong>
          <p>
            Deploy the workshop contracts and restart the frontend, or configure their addresses in
            your frontend environment. The README includes the exact commands.
          </p>
          <button className="text-button" onClick={() => void session.retryDeployment()}>
            Check configuration again →
          </button>
        </div>
      )}
      {wrongNetwork && (
        <div className="notice" role="alert">
          Switch your connected wallet to Sepolia.{" "}
          <button
            className="text-button"
            disabled={switchingChain}
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
          >
            Switch network →
          </button>
        </div>
      )}
      <div className="workspace-grid">
        <EmployerPanel payroll={payroll} disabled={disabled} isEmployer={session.isEmployer} />
        <EmployeePanel
          payroll={payroll}
          assets={assets}
          address={session.account.address}
          disabled={disabled}
        />
      </div>
      <div
        className={`status-bar${session.error ? " status-error" : ""}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={`status-dot${session.busy ? " working" : ""}`} aria-hidden="true" />
        <div>
          <p>{session.error || session.status}</p>
          {session.transactionHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${session.transactionHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View transaction on Etherscan ↗
            </a>
          )}
        </div>
        {session.busy && <span className="eyebrow">IN PROGRESS</span>}
      </div>
      <AssetsPanel assets={assets} disabled={disabled} />
      {session.deployment && (
        <p className="contract-link">
          Payroll on Sepolia{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://sepolia.etherscan.io/address/${session.deployment.payroll}`}
          >
            {session.deployment.payroll} ↗
          </a>
        </p>
      )}
    </>
  );
}

export function PayrollApp() {
  const account = useAccount();
  return (
    <>
      <header className="site-header">
        <a href="#main" className="wordmark">
          <span className="brand-square" aria-hidden="true">
            z
          </span>
          <span>
            Zama <span className="brand-cross">×</span> Web3Bridge
          </span>
        </a>
        <div className="header-actions">
          <span className="network-badge">
            <span aria-hidden="true" />
            SEPOLIA
          </span>
          <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} />
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <p className="eyebrow">THE CONFIDENTIAL ONCHAIN FINANCE WORKSHOP</p>
            <h1>
              Payroll.
              <br />
              <span>With discretion.</span>
            </h1>
          </div>
          <div className="hero-note">
            <span className="note-mark" aria-hidden="true">
              ↳
            </span>
            <p>
              Manage salaries.
              <br />
              Pay onchain.
              <br />
              <strong>Keep the numbers private.</strong>
            </p>
            <span className="eyebrow">BUILT WITH ZAMA · ERC-7984</span>
          </div>
        </section>
        <div className="journey">
          <span>01 ENCRYPT</span>
          <span aria-hidden="true">→</span>
          <span>02 COMPUTE</span>
          <span aria-hidden="true">→</span>
          <span>03 AUTHORIZE</span>
          <span aria-hidden="true">→</span>
          <span>04 PAY</span>
        </div>
        <ConnectedWorkspace
          key={`${account.address ?? "disconnected"}:${account.chainId ?? "none"}`}
        />
      </main>
      <footer>
        <span>Confidentiality is a permission. Not a hidden address.</span>
        <a target="_blank" rel="noreferrer" href="https://docs.zama.org/protocol">
          Keep building ↗
        </a>
        <span>ZAMA × WEB3BRIDGE / NIGERIA</span>
      </footer>
    </>
  );
}
