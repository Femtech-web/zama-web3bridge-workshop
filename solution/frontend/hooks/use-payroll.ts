"use client";

import { useState } from "react";
import { getAddress, isAddress, zeroHash } from "viem";
import { sepolia } from "viem/chains";
import { parsePeriod, parseTokenAmount, displayAmount } from "@/lib/amounts";
import { payrollAbi } from "@/lib/contracts/payrollAbi";
import { writeSalary } from "@/lib/contracts/write-salary";
import { encryptAmount } from "@/lib/zama/encryption";
import { decryptAmount } from "@/lib/zama/decryption";
import type { WorkshopSession } from "./use-workshop-session";

export function usePayroll(session: WorkshopSession) {
  const [employeeInput, setEmployeeInput] = useState("");
  const [salaryInput, setSalaryInput] = useState("");
  const [bonusInput, setBonusInput] = useState("");
  const [periodInput, setPeriodInput] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [salary, setSalary] = useState<string>();

  function selectedEmployee() {
    if (!isAddress(employeeInput)) throw new Error("Enter a valid employee wallet address.");
    return getAddress(employeeInput);
  }

  function updateSalary(action: "setSalary" | "addBonus") {
    return session.runTask(async () => {
      const { address, walletClient, deployment } = session.requireSession();
      if (!session.isEmployer) throw new Error("Connect the employer wallet to manage payroll.");
      const employee = selectedEmployee();
      const amount = parseTokenAmount(action === "setSalary" ? salaryInput : bonusInput);
      session.setStatus(action === "setSalary" ? "Encrypting salary…" : "Encrypting bonus…");
      const sdk = await session.getSdk();
      const encrypted = await encryptAmount(sdk, deployment.payroll, address, amount);
      session.setStatus("Waiting for wallet…");
      await session.confirmTransaction(
        await writeSalary(
          walletClient,
          address,
          deployment.payroll,
          employee,
          action,
          encrypted.encryptedValue,
          encrypted.inputProof,
        ),
      );
      setSalary(undefined);
      setSalaryInput("");
      setBonusInput("");
      return action === "setSalary"
        ? "Salary updated. Only authorized wallets can view it."
        : "Bonus processed. On overflow, the previous salary is retained; the employee can view the result.";
    });
  }

  function viewSalary() {
    return session.runTask(async () => {
      const { address, publicClient, deployment } = session.requireSession();
      const handle = await publicClient.readContract({
        address: deployment.payroll,
        abi: payrollAbi,
        functionName: "salaryOf",
        args: [address],
      });
      if (handle === zeroHash) {
        setSalary(undefined);
        return "No salary has been set for this wallet yet.";
      }
      session.setStatus(
        "Decrypting for you… Authorize private viewing in your wallet if prompted.",
      );
      const amount = await decryptAmount(await session.getSdk(), deployment.payroll, handle);
      setSalary(displayAmount(amount));
      return "Your salary is visible only in this browser session.";
    });
  }

  function payEmployee() {
    return session.runTask(async () => {
      const { address, walletClient, publicClient, deployment } = session.requireSession();
      if (!session.isEmployer) throw new Error("Connect the employer wallet to pay employees.");
      const employee = selectedEmployee();
      const period = parsePeriod(periodInput);
      const state = await publicClient.readContract({
        address: deployment.payroll,
        abi: payrollAbi,
        functionName: "paymentState",
        args: [employee, period],
      });
      session.setStatus("Waiting for wallet…");
      const hash = await walletClient.writeContract({
        chain: sepolia,
        account: address,
        address: deployment.payroll,
        abi: payrollAbi,
        functionName: "pay",
        args: [employee, period, state.attempts],
      });
      await session.confirmTransaction(hash);
      session.setStatus("Payment confirmed. Privately checking the unpaid remainder…");
      const receipt = await publicClient.readContract({
        address: deployment.payroll,
        abi: payrollAbi,
        functionName: "paymentState",
        args: [employee, period],
      });
      const remaining = await decryptAmount(
        await session.getSdk(),
        deployment.payroll,
        receipt.remaining,
      );
      return remaining === 0n
        ? "Payment complete. This period has no unpaid remainder."
        : "Payment did not settle: insufficient confidential treasury balance. Shield funds to payroll, then retry this same period.";
    });
  }

  return {
    employeeInput,
    setEmployeeInput,
    salaryInput,
    setSalaryInput,
    bonusInput,
    setBonusInput,
    periodInput,
    setPeriodInput,
    salary,
    hideSalary: () => setSalary(undefined),
    updateSalary,
    viewSalary,
    payEmployee,
  };
}

export type PayrollControls = ReturnType<typeof usePayroll>;
