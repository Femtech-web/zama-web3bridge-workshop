"use client";

import { useId } from "react";

export function ConfidentialBalance({
  balance,
  label = "YOUR SHIELDED BALANCE",
  disabled,
  onView,
  onHide,
}: {
  balance?: string;
  label?: string;
  disabled: boolean;
  onView: () => void;
  onHide: () => void;
}) {
  const balanceId = useId();
  const isVisible = balance !== undefined;

  return (
    <div className="confidential-balance">
      <div>
        <p className="wallet-label">{label}</p>
        <p id={balanceId} className="balance-value" aria-live="polite">
          {balance ?? "Hidden"} <span>cwUSD</span>
        </p>
      </div>
      <button
        type="button"
        className="text-button"
        disabled={!isVisible && disabled}
        aria-controls={balanceId}
        onClick={isVisible ? onHide : onView}
      >
        {isVisible ? "Hide balance" : "View balance"}
      </button>
    </div>
  );
}
