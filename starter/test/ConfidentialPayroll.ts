import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const TOKEN_UNIT = 10n ** 6n;
const MAX_UINT64 = (1n << 64n) - 1n;
const PERIOD = 202611n;

async function deployPayrollFixture() {
  const [employer, employee, outsider] = await ethers.getSigners();
  const publicToken = await (await ethers.getContractFactory("WorkshopUSD")).deploy();
  const confidentialToken = await (
    await ethers.getContractFactory("ConfidentialWorkshopUSD")
  ).deploy(await publicToken.getAddress());
  const payroll = await (
    await ethers.getContractFactory("ConfidentialPayroll")
  ).deploy(employer.address, await confidentialToken.getAddress());
  await Promise.all([
    publicToken.waitForDeployment(),
    confidentialToken.waitForDeployment(),
    payroll.waitForDeployment(),
  ]);
  return { employer, employee, outsider, publicToken, confidentialToken, payroll };
}

type PayrollFixture = Awaited<ReturnType<typeof deployPayrollFixture>>;

async function encryptAmount(
  contractAddress: string,
  sender: HardhatEthersSigner,
  amount: bigint,
): Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }> {
  // Slide 9 | Step 6: Build encrypted test input.
  // @workshop:start 6
  // TODO 6: Create and encrypt a local input for this sender and contract.
  // Docs: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test
  throw new Error("Complete TODO 6: create and encrypt the local input.");
  // @workshop:end 6
}

async function decryptAmount(handle: string, contractAddress: string, signer: HardhatEthersSigner) {
  if (handle === ethers.ZeroHash) return 0n;
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, signer);
}

async function setSalary(fixture: PayrollFixture, amount = 5_000n * TOKEN_UNIT) {
  const { payroll, employer, employee } = fixture;
  const encrypted = await encryptAmount(await payroll.getAddress(), employer, amount);
  await payroll.setSalary(employee.address, encrypted.handles[0], encrypted.inputProof);
}

async function fundTreasury(fixture: PayrollFixture, amount: bigint) {
  const { publicToken, confidentialToken, payroll } = fixture;
  await publicToken.faucet();
  await publicToken.approve(await confidentialToken.getAddress(), amount);
  await confidentialToken.wrap(await payroll.getAddress(), amount);
}

describe("Deployment and workshop baseline", function () {
  it("deploys the official wrapper with six-decimal practice money", async function () {
    const { employer, publicToken, confidentialToken, payroll } = await deployPayrollFixture();
    expect(await payroll.employer()).to.equal(employer.address);
    expect(await payroll.token()).to.equal(await confidentialToken.getAddress());
    expect(await confidentialToken.underlying()).to.equal(await publicToken.getAddress());
    expect(await confidentialToken.decimals()).to.equal(6);
    expect(await confidentialToken.rate()).to.equal(1);
  });

  it("starts with an unset salary handle", async function () {
    const { payroll, employee } = await deployPayrollFixture();
    expect(await payroll.salaryOf(employee.address)).to.equal(ethers.ZeroHash);
  });

  it("provides a public, valueless testnet faucet", async function () {
    const { publicToken, employer } = await deployPayrollFixture();
    await publicToken.faucet();
    expect(await publicToken.balanceOf(employer.address)).to.equal(100_000n * TOKEN_UNIT);
  });
});

const describeConfidentialFlow = process.env.WORKSHOP_FULL_TESTS === "1" ? describe : describe.skip;

describeConfidentialFlow("Confidential salary and permissions", function () {
  it("lets the employer set encrypted salary and the employee decrypt it", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const { payroll, employee } = fixture;
    const salaryHandle = await payroll.salaryOf(employee.address);
    expect(salaryHandle).not.to.equal(ethers.ZeroHash);
    expect(await decryptAmount(salaryHandle, await payroll.getAddress(), employee)).to.equal(
      5_000n * TOKEN_UNIT,
    );
  });

  it("lets the employer privately verify the salary they manage", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const { payroll, employer, employee } = fixture;
    expect(
      await decryptAmount(
        await payroll.salaryOf(employee.address),
        await payroll.getAddress(),
        employer,
      ),
    ).to.equal(5_000n * TOKEN_UNIT);
  });

  it("rejects a non-employer before reading their input", async function () {
    const { payroll, employee, outsider } = await deployPayrollFixture();
    await expect(
      payroll.connect(outsider).setSalary(employee.address, ethers.ZeroHash, "0x"),
    ).to.be.revertedWithCustomError(payroll, "OnlyEmployer");
    await expect(
      payroll.connect(outsider).addBonus(employee.address, ethers.ZeroHash, "0x"),
    ).to.be.revertedWithCustomError(payroll, "OnlyEmployer");
  });

  it("denies an unrelated user even though the encrypted handle is public", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const { payroll, employee, outsider } = fixture;
    const handle = await payroll.salaryOf(employee.address);
    const contractAddress = await payroll.getAddress();
    await rejects(() =>
      fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, outsider),
    );
  });

  it("does not let one employee decrypt another employee's salary", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const { payroll, employer, employee, outsider } = fixture;
    const encrypted = await encryptAmount(
      await payroll.getAddress(),
      employer,
      2_000n * TOKEN_UNIT,
    );
    await payroll.setSalary(outsider.address, encrypted.handles[0], encrypted.inputProof);
    const otherSalary = await payroll.salaryOf(outsider.address);
    await rejects(() =>
      fhevm.userDecryptEuint(FhevmType.euint64, otherSalary, payroll.getAddress(), employee),
    );
  });

  it("rejects input encrypted for the wrong sender", async function () {
    const { payroll, employee } = await deployPayrollFixture();
    const encrypted = await encryptAmount(await payroll.getAddress(), employee, 5_000n);
    await expect(payroll.setSalary(employee.address, encrypted.handles[0], encrypted.inputProof)).to
      .be.reverted;
  });

  it("rejects input encrypted for a different contract", async function () {
    const { payroll, confidentialToken, employer, employee } = await deployPayrollFixture();
    const encrypted = await encryptAmount(await confidentialToken.getAddress(), employer, 5_000n);
    await expect(payroll.setSalary(employee.address, encrypted.handles[0], encrypted.inputProof)).to
      .be.reverted;
  });

  it("rejects an encrypted handle without a valid proof", async function () {
    const { payroll, employee } = await deployPayrollFixture();
    await expect(payroll.setSalary(employee.address, ethers.ZeroHash, "0x1234")).to.be.reverted;
  });

  it("rejects invalid employee addresses", async function () {
    const { payroll, employer } = await deployPayrollFixture();
    for (const invalidAddress of [
      ethers.ZeroAddress,
      employer.address,
      await payroll.getAddress(),
    ]) {
      await expect(
        payroll.setSalary(invalidAddress, ethers.ZeroHash, "0x"),
      ).to.be.revertedWithCustomError(payroll, "InvalidAddress");
    }
  });

  it("rejects bonus and payment for an uninitialized employee", async function () {
    const { payroll, employee } = await deployPayrollFixture();
    await expect(
      payroll.addBonus(employee.address, ethers.ZeroHash, "0x"),
    ).to.be.revertedWithCustomError(payroll, "SalaryNotSet");
    await expect(payroll.pay(employee.address, PERIOD, 0)).to.be.revertedWithCustomError(
      payroll,
      "SalaryNotSet",
    );
  });

  it("adds an encrypted bonus and retains contract permissions across transactions", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const { payroll, employer, employee } = fixture;
    for (const bonus of [500n * TOKEN_UNIT, 100n * TOKEN_UNIT]) {
      const encrypted = await encryptAmount(await payroll.getAddress(), employer, bonus);
      await payroll.addBonus(employee.address, encrypted.handles[0], encrypted.inputProof);
    }
    expect(
      await decryptAmount(
        await payroll.salaryOf(employee.address),
        await payroll.getAddress(),
        employee,
      ),
    ).to.equal(5_600n * TOKEN_UNIT);
  });

  it("retains the original salary on confidential overflow", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture, MAX_UINT64 - 2n);
    const { payroll, employer, employee } = fixture;
    const encrypted = await encryptAmount(await payroll.getAddress(), employer, 3n);
    await payroll.addBonus(employee.address, encrypted.handles[0], encrypted.inputProof);
    expect(
      await decryptAmount(
        await payroll.salaryOf(employee.address),
        await payroll.getAddress(),
        employee,
      ),
    ).to.equal(MAX_UINT64 - 2n);
  });

  it("permits a sum exactly equal to uint64 maximum", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture, MAX_UINT64 - 2n);
    const { payroll, employer, employee } = fixture;
    const encrypted = await encryptAmount(await payroll.getAddress(), employer, 2n);
    await payroll.addBonus(employee.address, encrypted.handles[0], encrypted.inputProof);
    expect(
      await decryptAmount(
        await payroll.salaryOf(employee.address),
        await payroll.getAddress(),
        employee,
      ),
    ).to.equal(MAX_UINT64);
  });
});

describeConfidentialFlow("Shield, pay, and unshield", function () {
  async function createWithdrawal() {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 6_000n * TOKEN_UNIT);
    const { payroll, confidentialToken, employee } = fixture;
    await payroll.pay(employee.address, PERIOD, 0);
    const encrypted = await encryptAmount(
      await confidentialToken.getAddress(),
      employee,
      1_000n * TOKEN_UNIT,
    );
    const employeeToken = confidentialToken.connect(employee);
    const transaction = await employeeToken["unwrap(address,address,bytes32,bytes)"](
      employee.address,
      employee.address,
      encrypted.handles[0],
      encrypted.inputProof,
    );
    const receipt = await transaction.wait();
    const request = receipt?.logs
      .map((log) => {
        try {
          return confidentialToken.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event?.name === "UnwrapRequested");
    if (!request) throw new Error("Expected an UnwrapRequested event.");
    const requestId: `0x${string}` = request.args.unwrapRequestId;
    return { ...fixture, requestId };
  }

  it("never makes a salary publicly decryptable", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const salaryHandle = await fixture.payroll.salaryOf(fixture.employee.address);
    await rejects(() => fhevm.publicDecrypt([salaryHandle]));
  });

  it("funds the treasury and pays an employee with the official ERC-7984 token", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 6_000n * TOKEN_UNIT);
    const { payroll, confidentialToken, employee } = fixture;
    await payroll.pay(employee.address, PERIOD, 0);
    expect(
      await decryptAmount(
        await confidentialToken.confidentialBalanceOf(employee.address),
        await confidentialToken.getAddress(),
        employee,
      ),
    ).to.equal(5_000n * TOKEN_UNIT);
    const payment = await payroll.paymentState(employee.address, PERIOD);
    expect(await decryptAmount(payment.remaining, await payroll.getAddress(), employee)).to.equal(
      0n,
    );
    expect(
      await decryptAmount(payment.lastTransferred, await payroll.getAddress(), employee),
    ).to.equal(5_000n * TOKEN_UNIT);
  });

  it("rejects payment by an unrelated wallet and period zero", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    const { payroll, employee, outsider } = fixture;
    await expect(
      payroll.connect(outsider).pay(employee.address, PERIOD, 0),
    ).to.be.revertedWithCustomError(payroll, "OnlyEmployer");
    await expect(payroll.pay(employee.address, 0, 0)).to.be.revertedWithCustomError(
      payroll,
      "InvalidPeriod",
    );
  });

  it("blocks duplicate transaction arguments and cannot pay a settled period twice", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 15_000n * TOKEN_UNIT);
    const { payroll, confidentialToken, employee } = fixture;
    await payroll.pay(employee.address, PERIOD, 0);
    await expect(payroll.pay(employee.address, PERIOD, 0)).to.be.revertedWithCustomError(
      payroll,
      "StaleAttempt",
    );
    await payroll.pay(employee.address, PERIOD, 1);
    expect(
      await decryptAmount(
        await confidentialToken.confidentialBalanceOf(employee.address),
        await confidentialToken.getAddress(),
        employee,
      ),
    ).to.equal(5_000n * TOKEN_UNIT);
  });

  it("retains unpaid liability after insufficient funds and allows a funded retry", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 100n * TOKEN_UNIT);
    const { payroll, employee } = fixture;
    await payroll.pay(employee.address, PERIOD, 0);
    const failedPayment = await payroll.paymentState(employee.address, PERIOD);
    expect(
      await decryptAmount(failedPayment.lastTransferred, await payroll.getAddress(), employee),
    ).to.equal(0n);
    expect(
      await decryptAmount(failedPayment.remaining, await payroll.getAddress(), employee),
    ).to.equal(5_000n * TOKEN_UNIT);
    await fundTreasury(fixture, 5_000n * TOKEN_UNIT);
    await payroll.pay(employee.address, PERIOD, 1);
    const retriedPayment = await payroll.paymentState(employee.address, PERIOD);
    expect(
      await decryptAmount(retriedPayment.remaining, await payroll.getAddress(), employee),
    ).to.equal(0n);
  });

  it("snapshots each period so later salary changes cannot increase its unpaid liability", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 100n * TOKEN_UNIT);
    const { payroll, employee } = fixture;
    await payroll.pay(employee.address, PERIOD, 0);
    await setSalary(fixture, 8_000n * TOKEN_UNIT);
    await fundTreasury(fixture, 10_000n * TOKEN_UNIT);
    await payroll.pay(employee.address, PERIOD, 1);
    const payment = await payroll.paymentState(employee.address, PERIOD);
    expect(
      await decryptAmount(payment.lastTransferred, await payroll.getAddress(), employee),
    ).to.equal(5_000n * TOKEN_UNIT);
    await payroll.pay(employee.address, PERIOD + 1n, 0);
    const nextPeriod = await payroll.paymentState(employee.address, PERIOD + 1n);
    expect(
      await decryptAmount(nextPeriod.remaining, await payroll.getAddress(), employee),
    ).to.equal(8_000n * TOKEN_UNIT);
  });

  it("keeps payment receipts private from unrelated users", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 6_000n * TOKEN_UNIT);
    const { payroll, employee, outsider } = fixture;
    await payroll.pay(employee.address, PERIOD, 0);
    const payment = await payroll.paymentState(employee.address, PERIOD);
    await rejects(() =>
      fhevm.userDecryptEuint(
        FhevmType.euint64,
        payment.lastTransferred,
        payroll.getAddress(),
        outsider,
      ),
    );
  });

  it("unshields only after public decryption and proof-checked finalization", async function () {
    const { publicToken, confidentialToken, employee, requestId } = await createWithdrawal();
    expect(await publicToken.balanceOf(employee.address)).to.equal(0n);
    expect(
      await decryptAmount(
        await confidentialToken.confidentialBalanceOf(employee.address),
        await confidentialToken.getAddress(),
        employee,
      ),
    ).to.equal(4_000n * TOKEN_UNIT);
    const decrypted = await fhevm.publicDecrypt([requestId]);
    const amount = decrypted.clearValues[requestId];
    expect(amount).to.equal(1_000n * TOKEN_UNIT);
    await confidentialToken.finalizeUnwrap(
      requestId,
      BigInt(amount.toString()),
      decrypted.decryptionProof,
    );
    expect(await publicToken.balanceOf(employee.address)).to.equal(1_000n * TOKEN_UNIT);
    await expect(
      confidentialToken.finalizeUnwrap(
        requestId,
        BigInt(amount.toString()),
        decrypted.decryptionProof,
      ),
    ).to.be.revertedWithCustomError(confidentialToken, "InvalidUnwrapRequest");
  });

  it("rejects a forged clear withdrawal amount and preserves the pending request", async function () {
    const { confidentialToken, employee, requestId } = await createWithdrawal();
    const decrypted = await fhevm.publicDecrypt([requestId]);
    await expect(
      confidentialToken.finalizeUnwrap(requestId, 2_000n * TOKEN_UNIT, decrypted.decryptionProof),
    ).to.be.reverted;
    expect(await confidentialToken.unwrapRequester(requestId)).to.equal(employee.address);
  });

  it("denies unshielding someone else's confidential balance", async function () {
    const { confidentialToken, employee, outsider } = await createWithdrawal();
    const encrypted = await encryptAmount(await confidentialToken.getAddress(), outsider, 1n);
    const unauthorizedToken = confidentialToken.connect(outsider);
    await expect(
      unauthorizedToken["unwrap(address,address,bytes32,bytes)"](
        employee.address,
        outsider.address,
        encrypted.handles[0],
        encrypted.inputProof,
      ),
    ).to.be.revertedWithCustomError(confidentialToken, "ERC7984UnauthorizedSpender");
  });
});

describeConfidentialFlow("Private treasury balance", function () {
  it("handles an unfunded treasury without granting a zero handle", async function () {
    const { payroll } = await deployPayrollFixture();
    const state = await payroll.treasuryBalance();
    expect(state.balance).to.equal(ethers.ZeroHash);
    expect(state.employerCanView).to.equal(true);
    await payroll.allowTreasuryBalanceViewing();
  });

  it("lets only the employer authorize treasury viewing, including before funding", async function () {
    const { payroll, employee, outsider } = await deployPayrollFixture();
    for (const signer of [employee, outsider]) {
      await expect(
        payroll.connect(signer).allowTreasuryBalanceViewing(),
      ).to.be.revertedWithCustomError(payroll, "OnlyEmployer");
    }
  });

  it("privately reveals the funded treasury to the employer without moving funds", async function () {
    const fixture = await deployPayrollFixture();
    await fundTreasury(fixture, 6_000n * TOKEN_UNIT);
    const { payroll, confidentialToken, employer, employee, outsider } = fixture;
    const tokenAddress = await confidentialToken.getAddress();
    const before = await payroll.treasuryBalance();
    expect(before.employerCanView).to.equal(false);
    await rejects(() => decryptAmount(before.balance, tokenAddress, employer));
    await payroll.allowTreasuryBalanceViewing();
    const after = await payroll.treasuryBalance();
    expect(after.balance).to.equal(before.balance);
    expect(after.employerCanView).to.equal(true);
    expect(
      await decryptAmount(after.balance, await confidentialToken.getAddress(), employer),
    ).to.equal(6_000n * TOKEN_UNIT);
    for (const signer of [employee, outsider]) {
      await rejects(() => decryptAmount(after.balance, tokenAddress, signer));
    }
    await rejects(() => fhevm.publicDecrypt([after.balance]));
  });

  it("requires permission for a new balance after another deposit", async function () {
    const fixture = await deployPayrollFixture();
    await fundTreasury(fixture, 100n * TOKEN_UNIT);
    await fixture.payroll.allowTreasuryBalanceViewing();
    const before = await fixture.payroll.treasuryBalance();
    await fundTreasury(fixture, 200n * TOKEN_UNIT);
    const after = await fixture.payroll.treasuryBalance();
    expect(after.balance).not.to.equal(before.balance);
    expect(after.employerCanView).to.equal(false);
    await fixture.payroll.allowTreasuryBalanceViewing();
    expect(
      await decryptAmount(
        after.balance,
        await fixture.confidentialToken.getAddress(),
        fixture.employer,
      ),
    ).to.equal(300n * TOKEN_UNIT);
  });

  it("uses the remaining token balance after an employee payment", async function () {
    const fixture = await deployPayrollFixture();
    await setSalary(fixture);
    await fundTreasury(fixture, 6_000n * TOKEN_UNIT);
    await fixture.payroll.allowTreasuryBalanceViewing();
    await fixture.payroll.pay(fixture.employee.address, PERIOD, 0);
    const state = await fixture.payroll.treasuryBalance();
    expect(state.employerCanView).to.equal(false);
    await fixture.payroll.allowTreasuryBalanceViewing();
    expect(
      await decryptAmount(
        state.balance,
        await fixture.confidentialToken.getAddress(),
        fixture.employer,
      ),
    ).to.equal(1_000n * TOKEN_UNIT);
  });
});
