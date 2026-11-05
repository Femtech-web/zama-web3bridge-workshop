"use client";

import type { AssetControls } from "@/hooks/use-assets";

export function AssetsPanel({ assets, disabled }: { assets: AssetControls; disabled: boolean }) {
  return (
    <section className="panel assets-panel" aria-labelledby="assets-heading">
      <div className="assets-heading">
        <div>
          <div className="section-top">
            <span className="step-number">03</span>
            <span className="eyebrow">MOVE BETWEEN PUBLIC & PRIVATE</span>
          </div>
          <h2 id="assets-heading">Assets</h2>
        </div>
        <div className="public-balance">
          <span>YOUR PUBLIC BALANCE</span>
          <strong>
            {assets.publicBalance ?? "—"} <small>wUSD</small>
          </strong>
          <button className="text-button" disabled={disabled} onClick={() => void assets.faucet()}>
            Get practice tokens ↗
          </button>
        </div>
      </div>
      {assets.publicBalanceError && (
        <p className="hint" role="alert">
          Public balance could not be loaded. Check the Sepolia RPC.
        </p>
      )}
      <div className="asset-flow" aria-label="Payment journey">
        <span>Public wUSD</span>
        <span aria-hidden="true">→</span>
        <span>Shield</span>
        <span aria-hidden="true">→</span>
        <strong>Confidential payroll</strong>
        <span aria-hidden="true">→</span>
        <span>Unshield</span>
      </div>
      <div className="assets-grid">
        <div>
          <label htmlFor="asset-amount">
            Token amount <span>wUSD / cwUSD</span>
          </label>
          <input
            id="asset-amount"
            value={assets.amountInput}
            onChange={(event) => assets.setAmountInput(event.target.value)}
            placeholder="6000.00"
            inputMode="decimal"
            autoComplete="off"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={assets.shieldToPayroll}
              onChange={(event) => assets.setShieldToPayroll(event.target.checked)}
            />{" "}
            Shield to payroll treasury <span className="hint">Uncheck to fund your wallet.</span>
          </label>
          <div className="button-row">
            <button disabled={disabled || !assets.amountInput} onClick={() => void assets.shield()}>
              Shield tokens ↗
            </button>
            <button
              className="secondary"
              disabled={disabled || !assets.amountInput}
              onClick={() => void assets.requestUnshield()}
            >
              Request unshield ↗
            </button>
          </div>
        </div>
        <div className="finalize-box">
          <label htmlFor="withdrawal-id">Pending unshield request ID</label>
          <input
            id="withdrawal-id"
            value={assets.withdrawalId}
            onChange={(event) => assets.setWithdrawalId(event.target.value)}
            placeholder="0x… from UnwrapRequested"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="hint">
            Unshield takes two transactions. Keep this public request ID to resume after a refresh.
            Retry finalization once decryption is ready.
          </p>
          <button
            className="secondary"
            disabled={disabled || !assets.withdrawalId}
            onClick={() => void assets.finalizeUnshield()}
          >
            Finalize unshield →
          </button>
        </div>
      </div>
      <p className="disclosure">
        Shield and unshield amounts are public. Salaries, bonuses, private balances, and payroll
        transfer amounts remain encrypted. Addresses and transaction timing are public.
      </p>
    </section>
  );
}
