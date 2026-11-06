"use client";

import { useState } from "react";
import type { AssetControls } from "@/hooks/use-assets";
import type { TreasuryControls } from "@/hooks/use-treasury-balance";
import { ConfidentialBalance } from "./confidential-balance";

export function AssetsPanel({
  assets,
  treasury,
  disabled,
}: {
  assets: AssetControls;
  treasury: TreasuryControls;
  disabled: boolean;
}) {
  const [operation, setOperation] = useState<"shield" | "unshield">("shield");
  const isShielding = operation === "shield";

  return (
    <section className="panel assets-panel" aria-labelledby="assets-heading">
      <div className="section-top">
        <span className="step-number">03</span>
        <span className="eyebrow">PUBLIC & PRIVATE TOKENS</span>
      </div>
      <h2 id="assets-heading">Assets</h2>
      <div className="asset-balances">
        <div className="public-balance">
          <p className="wallet-label">YOUR PUBLIC BALANCE</p>
          <p className="balance-value">
            {assets.publicBalance ?? "—"} <span>wUSD</span>
          </p>
          <button className="text-button" disabled={disabled} onClick={() => void assets.faucet()}>
            Get practice tokens ↗
          </button>
          {assets.publicBalanceError && (
            <p className="hint" role="alert">
              Balance unavailable. Please retry.
            </p>
          )}
        </div>
        <ConfidentialBalance
          balance={assets.confidentialBalance}
          disabled={disabled}
          onView={() => void assets.viewBalance()}
          onHide={assets.hideBalance}
        />
        {treasury.isEmployer && (
          <div className="treasury-balance">
            <ConfidentialBalance
              label="PAYROLL SHIELDED BALANCE"
              balance={treasury.balance}
              disabled={disabled || !treasury.supported}
              onView={() => void treasury.viewBalance()}
              onHide={treasury.hideBalance}
            />
            {!treasury.supported && (
              <p className="hint">This earlier payroll does not support balance viewing.</p>
            )}
            {treasury.error && (
              <p className="hint" role="alert">
                Payroll balance unavailable. Please retry.
              </p>
            )}
          </div>
        )}
      </div>
      <details className="inline-help">
        <summary>How these balances work</summary>
        <p>
          Your shielded balance belongs to your connected wallet. Payroll holds a separate balance
          for employee payments; only the employer can view it.
        </p>
        <p>
          Viewing payroll's balance may first ask for an authorization transaction after a deposit
          or payment. This does not move tokens.
        </p>
      </details>
      <div className="asset-operation-switch" role="group" aria-label="Token action">
        <button
          type="button"
          aria-pressed={isShielding}
          aria-controls="asset-operation"
          onClick={() => setOperation("shield")}
        >
          Shield
        </button>
        <button
          type="button"
          aria-pressed={!isShielding}
          aria-controls="asset-operation"
          onClick={() => setOperation("unshield")}
        >
          Unshield
        </button>
      </div>
      <div id="asset-operation" className="asset-operation">
        <p className="panel-intro">
          {isShielding
            ? "Move public tokens into a shielded balance."
            : "Withdraw shielded tokens from your wallet in two steps."}
        </p>
        <div className="assets-grid">
          <div>
            <label htmlFor="asset-amount">
              Amount <span>{isShielding ? "wUSD" : "cwUSD"}</span>
            </label>
            <input
              id="asset-amount"
              value={assets.amountInput}
              onChange={(event) => assets.setAmountInput(event.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
          {isShielding ? (
            <div>
              <label htmlFor="shield-destination">Send to</label>
              <select
                id="shield-destination"
                value={assets.shieldToPayroll ? "payroll" : "wallet"}
                onChange={(event) => assets.setShieldToPayroll(event.target.value === "payroll")}
                aria-describedby="shield-recipient"
              >
                <option value="payroll">Payroll treasury</option>
                <option value="wallet">My wallet</option>
              </select>
              <p id="shield-recipient" className="hint" aria-live="polite">
                {assets.shieldToPayroll
                  ? "Funds employee payments."
                  : "Adds to your wallet’s shielded balance."}{" "}
                {assets.shieldRecipient && (
                  <a
                    href={`https://sepolia.etherscan.io/address/${assets.shieldRecipient}`}
                    target="_blank"
                    rel="noreferrer"
                    title={assets.shieldRecipient}
                    aria-label={`View recipient ${assets.shieldRecipient} on Etherscan`}
                  >
                    {assets.shieldRecipient.slice(0, 6)}…{assets.shieldRecipient.slice(-4)} ↗
                  </a>
                )}
              </p>
            </div>
          ) : (
            <p className="withdrawal-note">1. Request a withdrawal. 2. Complete it below.</p>
          )}
        </div>
        <button
          className={isShielding ? "primary asset-submit" : "asset-submit"}
          disabled={disabled || !assets.amountInput}
          onClick={() => void (isShielding ? assets.shield() : assets.requestUnshield())}
        >
          {isShielding ? "Shield tokens" : "Request unshield"} <span aria-hidden="true">↗</span>
        </button>
        {!isShielding && (
          <details className="unshield-finalization" open={Boolean(assets.withdrawalId)}>
            <summary>Complete a pending withdrawal</summary>
            <label htmlFor="withdrawal-id">Request ID</label>
            <input
              id="withdrawal-id"
              value={assets.withdrawalId}
              onChange={(event) => assets.setWithdrawalId(event.target.value)}
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="withdrawal-help"
            />
            <p className="hint" id="withdrawal-help">
              Keep this ID to resume after a refresh. If processing is still underway, try again
              shortly.
            </p>
            <button
              className="secondary"
              disabled={disabled || !assets.withdrawalId}
              onClick={() => void assets.finalizeUnshield()}
            >
              Finalize unshield <span aria-hidden="true">→</span>
            </button>
          </details>
        )}
      </div>
      <p className="disclosure">
        Salaries and shielded balances are private. Shield and unshield amounts, wallet addresses,
        and transaction times are public.
      </p>
    </section>
  );
}
