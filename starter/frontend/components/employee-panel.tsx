"use client";

import type { PayrollControls } from "@/hooks/use-payroll";
import type { AssetControls } from "@/hooks/use-assets";

export function EmployeePanel({
  payroll,
  assets,
  address,
  disabled,
}: {
  payroll: PayrollControls;
  assets: AssetControls;
  address?: string;
  disabled: boolean;
}) {
  return (
    <section className="panel employee-panel" aria-labelledby="employee-heading">
      <div className="section-top">
        <span className="step-number">02</span>
        <span className="eyebrow">AUTHORIZED VIEW</span>
      </div>
      <h2 id="employee-heading">Employee</h2>
      <p className="panel-intro">Your work. Your salary. Your permission.</p>
      <p className="wallet-label">CONNECTED WALLET</p>
      <p className="address">
        {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Wallet not connected"}
      </p>
      <div className="salary-display">
        <span className="privacy-badge">
          <span aria-hidden="true">▣</span>{" "}
          {payroll.salary === undefined ? "ENCRYPTED ONCHAIN" : "PRIVATE VIEW"}
        </span>
        <div className="salary-value">
          {payroll.salary === undefined ? (
            <span aria-label="Salary hidden" className="hidden-amount">
              ••••••
            </span>
          ) : (
            payroll.salary
          )}
          <span className="currency">wUSD</span>
        </div>
        <p>Salary including any accepted bonuses</p>
      </div>
      <div className="button-row">
        <button disabled={disabled} onClick={() => void payroll.viewSalary()}>
          View my salary <span aria-hidden="true">↗</span>
        </button>
        {payroll.salary !== undefined && (
          <button className="text-button" onClick={payroll.hideSalary}>
            Hide
          </button>
        )}
      </div>
      <div className="confidential-balance">
        <div>
          <p className="wallet-label">CONFIDENTIAL TOKEN BALANCE</p>
          <p className="balance-value">
            {assets.confidentialBalance ?? "Hidden"} <span>cwUSD</span>
          </p>
        </div>
        <button
          className="text-button"
          disabled={disabled}
          onClick={() => void assets.viewBalance()}
        >
          View balance
        </button>
      </div>
      <p className="hint">
        Viewing asks for a wallet signature, not a transaction. The connected employee can view
        their own salary.
      </p>
    </section>
  );
}
