"use client";

import type { PayrollControls } from "@/hooks/use-payroll";

export function EmployeePanel({
  payroll,
  address,
  disabled,
}: {
  payroll: PayrollControls;
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
      <p className="panel-intro">View the salary set for your connected wallet.</p>
      <p className="wallet-label">YOUR WALLET</p>
      <p className="address">
        {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Wallet not connected"}
      </p>
      <div className="salary-display">
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
        <p>Includes bonuses. Payments appear in Assets.</p>
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
      <p className="hint">Private viewing asks for a wallet signature.</p>
    </section>
  );
}
