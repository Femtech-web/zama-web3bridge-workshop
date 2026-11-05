"use client";

import type { PayrollControls } from "@/hooks/use-payroll";

export function EmployerPanel({
  payroll,
  disabled,
  isEmployer,
}: {
  payroll: PayrollControls;
  disabled: boolean;
  isEmployer: boolean;
}) {
  return (
    <section className="panel" aria-labelledby="employer-heading">
      <div className="section-top">
        <span className="step-number">01</span>
        <span className="eyebrow">MANAGE & PAY</span>
      </div>
      <h2 id="employer-heading">Employer</h2>
      <p className="panel-intro">A public transaction. A private salary.</p>
      {!isEmployer && (
        <p className="hint">Connect the deployed employer wallet to manage payroll.</p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void payroll.updateSalary("setSalary");
        }}
      >
        <label htmlFor="employee-address">Employee wallet</label>
        <input
          id="employee-address"
          value={payroll.employeeInput}
          onChange={(event) => payroll.setEmployeeInput(event.target.value)}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <label htmlFor="salary">
          Salary <span>wUSD</span>
        </label>
        <div className="input-action">
          <input
            id="salary"
            value={payroll.salaryInput}
            onChange={(event) => payroll.setSalaryInput(event.target.value)}
            placeholder="5000.00"
            inputMode="decimal"
            autoComplete="off"
            required
          />
          <button disabled={disabled || !isEmployer} type="submit">
            Set salary <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void payroll.updateSalary("addBonus");
        }}
      >
        <label htmlFor="bonus">
          Bonus <span>wUSD</span>
        </label>
        <div className="input-action">
          <input
            id="bonus"
            value={payroll.bonusInput}
            onChange={(event) => payroll.setBonusInput(event.target.value)}
            placeholder="500.00"
            inputMode="decimal"
            autoComplete="off"
            required
          />
          <button className="secondary" disabled={disabled || !isEmployer} type="submit">
            Add bonus <span aria-hidden="true">+</span>
          </button>
        </div>
      </form>
      <div className="payment-row">
        <div>
          <label htmlFor="payroll-period">Payroll period</label>
          <input
            id="payroll-period"
            value={payroll.periodInput}
            onChange={(event) => payroll.setPeriodInput(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            aria-describedby="period-help"
          />
        </div>
        <button
          className="primary"
          disabled={disabled || !isEmployer || !payroll.employeeInput}
          onClick={() => void payroll.payEmployee()}
        >
          Pay employee <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="hint" id="period-help">
        YYYYMM · Fund payroll in Assets first. Retries settle only this period’s unpaid remainder.
      </p>
    </section>
  );
}
