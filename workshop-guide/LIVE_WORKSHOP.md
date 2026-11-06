# Live workshop: Confidential Onchain Finance — From Idea to Code

A 60-minute lesson following the 16-slide Technical Workshop Master Guide. Prepare setup and token funding before the session. Teach contracts first, then tests, then the frontend.

## Slide-to-code map

Slide numbers refer to the presentation; step numbers refer to the 14 coding exercises below. In the starter, search for `Slide 5` or `Step 1`. Labels sit outside the TODO regions so they remain after applying a checkpoint. Code marked **Prepared demo**, **Prepared reference**, or **Prepared setup** is already supplied.

| Master slide                                        | Coding steps                | Code to open in `starter/`                                                                                                                                                                                                                             |
| --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5 — From Solidity to Confidential Solidity          | 1–2                         | [ConfidentialPayroll.sol](../starter/contracts/ConfidentialPayroll.sol): configuration and `salaryOf`                                                                                                                                                  |
| 6 — How Do You Put a Secret on a Public Blockchain? | 3                           | [ConfidentialPayroll.sol](../starter/contracts/ConfidentialPayroll.sol): `setSalary`                                                                                                                                                                   |
| 7 — Compute Without Decrypting                      | 4                           | [ConfidentialPayroll.sol](../starter/contracts/ConfidentialPayroll.sol): `addBonus`                                                                                                                                                                    |
| 8 — We Hid the Salary. Who Can Use It?              | 5                           | [ConfidentialPayroll.sol](../starter/contracts/ConfidentialPayroll.sol): `_grant`                                                                                                                                                                      |
| 9 — Prove It Before Building the Button             | 6                           | [test/ConfidentialPayroll.ts](../starter/test/ConfidentialPayroll.ts): test input helper                                                                                                                                                               |
| 10 — FHE Changes Some Solidity Assumptions          | 7                           | [ConfidentialPayroll.sol](../starter/contracts/ConfidentialPayroll.sol): overflow handling in `addBonus`                                                                                                                                               |
| 11 — Encrypt → Write → Decrypt                      | 8–11, Parts 1–4             | [client.ts](../starter/frontend/lib/zama/client.ts) → [encryption.ts](../starter/frontend/lib/zama/encryption.ts) → [write-salary.ts](../starter/frontend/lib/contracts/write-salary.ts) → [decryption.ts](../starter/frontend/lib/zama/decryption.ts) |
| 12 — ERC-7984: Confidential Tokens                  | Prepared reference; no TODO | [WorkshopAssets.sol](../starter/contracts/WorkshopAssets.sol): public token and confidential wrapper                                                                                                                                                   |
| 13 — From Encrypted Salary to Confidential Payment  | 12                          | [ConfidentialPayroll.sol](../starter/contracts/ConfidentialPayroll.sol): `pay`                                                                                                                                                                         |
| 14 — Shield → Pay → Unshield                        | 13–14; prepared demo        | [use-assets.ts](../starter/frontend/hooks/use-assets.ts); [use-treasury-balance.ts](../starter/frontend/hooks/use-treasury-balance.ts) for employer viewing                                                                                            |

Slides 1–4 introduce the project and protocol. Slides 15–16 cover other applications, resources, and the auditor challenge; they add no numbered exercises.

## Before the room opens

In `solution/`, run `nvm use`, `npm ci`, and `npm run verify`. Install and check `starter/` separately with the same commands. Each project owns its dependencies and configuration. Rehearse on the tested solution deployment with two browser wallet accounts: the employer and a different, Sepolia-ETH-funded employee. From `solution/`, confirm `npm run check:sepolia` and the live test. See the root [README](../README.md#connect-to-sepolia) for setup.

For the frontend half, copy the public rehearsal configuration with `cp ../workshop-guide/DEPLOYMENT.json frontend/deployment.json` from `starter/`. This points the starter UI at the already completed solution deployment. Keep the solution on port 3000 and run the starter frontend on port 3001.

Open `starter/` in the editor and keep the lesson terminal in that folder. All step commands below run from `starter/`. Keep `solution/`, this guide, the terminal, and the deployed solution frontend available. You can show the prepared Sepolia solution while modifying/testing the starter locally; a source change does not upgrade a deployed contract. To demo the completed starter against its own contracts, deploy it after checkpoint 12 and use its generated deployment.json.

Default starter tests show 3 baseline passes and 28 pending confidential exercises. This is intentional: incomplete actions are guarded by numbered TODO errors. `test:full` enables the actual exercise suite. Do not present pending tests as proof of confidential correctness.

## Opening: slides 1–4, ten minutes

**Confidential Onchain Finance — From Idea to Code.** “An employer wants to pay people onchain without publishing everyone's salary.” Show `resources/PublicPayroll.sol`: normal storage and normal input expose amounts even if a variable is named private.

**What We Are Building.** Show Employer, Employee, Assets. Use 5000 salary + 500 bonus; employee privately sees 5500; then demonstrate payment. All amounts use six decimal places.

**Zama Architecture in One Picture.** Use [ARCHITECTURE.md](ARCHITECTURE.md). Explain host-chain handles, coprocessor computation, Gateway coordination, KMS keys, and browser interaction. Do not turn this into a cryptography lecture.

**The Journey of One Encrypted Salary.** Enter → encrypt → handle/proof → verify → compute → allow → employee views. Ask students to follow this one salary through the code.

## Recovery convention

Each code block below is the exact solution region. Copy only that numbered region, or use `node ../workshop-guide/scripts/checkpoint.mjs N --apply` to recover all TODOs through N. The checkpoint command backs up touched starter files under the repository's `.workshop-backups/`; it preserves other code and never copies environment files. Preview with the same command without `--apply`. It does not deploy contracts or copy private keys.

## Step 1 — Configure FHEVM

**Slide / concept:** Slide 5 — From Solidity to Confidential Solidity

**Problem:** The payroll contract must know the Zama contracts that run encrypted work, check inputs, and manage access.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 1

**Explain:** “We keep normal Solidity deployment. Inheriting ZamaEthereumConfig installs the supported chain configuration; we are not inventing protocol addresses.”

**Code change:** Replace this TODO region with:

```solidity
ZamaEthereumConfig,
```

**Run from `starter/`:**

```bash
npm run compile
```

**Expected:** The contract compiles with ZamaEthereumConfig and ReentrancyGuard.

**Likely failure:** An import was omitted or the comma in the inheritance list is missing.

**Recovery:** Apply checkpoint 1, then compile again.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/v0.11/smart-contract/configure)

## Step 2 — Encrypted types and handles

**Slide / concept:** Slide 5 — From Solidity to Confidential Solidity

**Problem:** A public uint64 exposes salary. A private Solidity variable still exposes blockchain storage.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 2

**Explain:** “The euint64 stores an encrypted-value handle. Returning that handle does not return the salary. Six-decimal money fits in 64 bits, and choosing a larger encrypted type would add cost.”

**Code change:** Replace this TODO region with:

```solidity
return salaries[employee];
```

**Run from `starter/`:**

```bash
npm run compile
```

**Expected:** salaryOf returns euint64; an unset employee still has the zero handle.

**Likely failure:** A handle is mistaken for the salary, or code tries to return uint64.

**Recovery:** Apply checkpoint 2. Do not cast a handle into a supposed plaintext amount.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)

## Step 3 — Verify encrypted external input

**Slide / concept:** Slide 6 — How Do You Put a Secret on a Public Blockchain?

**Problem:** The employer must supply a salary without putting its plaintext in transaction input.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 3

**Explain:** “The browser will send an externalEuint64 and its input proof. fromExternal verifies the input in this contract and sender context. We are not trusting arbitrary bytes32 data.”

**Code change:** Replace this TODO region with:

```solidity
euint64 value = FHE.fromExternal(encryptedSalary, inputProof);
```

**Run from `starter/`:**

```bash
npm run compile
```

**Expected:** setSalary converts the external value; unfinished permission code still guards the action.

**Likely failure:** The handle and proof come from different encryptions, or the input was bound to another sender/contract.

**Recovery:** Apply checkpoint 3. During the browser demo, regenerate input after changing wallets or deployment.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs)

## Step 4 — Compute without decrypting

**Slide / concept:** Slide 7 — Compute Without Decrypting

**Problem:** We need to add a bonus without reading salary onchain.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 4

**Explain:** “Both inputs remain encrypted. FHE.add expresses the computation. No Solidity if can inspect an encrypted comparison, and no decryption is needed for addition.”

**Code change:** Replace this TODO region with:

```solidity
euint64 candidate = FHE.add(previous, bonus);
```

**Run from `starter/`:**

```bash
npm run compile
```

**Expected:** The candidate salary is computed using FHE.add. The starter still uses the deliberately unsafe candidate until step 7.

**Likely failure:** Normal + is used with encrypted types, or someone proposes decrypting before computing.

**Recovery:** Apply checkpoint 4. Point to the unsafe updated = candidate line; keep the overflow discussion for step 7.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations)

## Step 5 — Who may access the salary?

**Slide / concept:** Slide 8 — We Hid the Salary. Who Can Use It?

**Problem:** Encryption alone does not answer who can reuse or view the result.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 5

**Explain:** “A new result has its own permissions. Payroll needs future access; the employee needs private viewing; the employer may verify what they manage. An unrelated wallet gets none.”

**Code change:** Replace this TODO region with:

```solidity
FHE.allowThis(value);
FHE.allow(value, employee);
FHE.allow(value, employer);
```

**Run from `starter/`:**

```bash
npm run compile
```

**Expected:** Every saved salary and payment result passes through the shared \_grant helper.

**Likely failure:** allowThis is missing and the next transaction fails; employee allowance is missing and decryption is denied.

**Recovery:** Apply checkpoint 5. Never solve an ACL failure by making salary publicly decryptable.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl)

## Step 6 — Test the confidential contract

**Slide / concept:** Slide 9 — Prove It Before Building the Button

**Problem:** Before adding wallet buttons, prove encrypted input binding and selective access locally.

**Open:** `starter/test/ConfidentialPayroll.ts`

**Complete:** TODO 6

**Explain:** “The official Hardhat plugin creates deterministic mock encrypted inputs. A user-decryption assertion checks the application ACL; a public handle does not make an unauthorized test user succeed.”

**Code change:** Replace this TODO region with:

```ts
return fhevm
  .createEncryptedInput(contractAddress, sender.address)
  .add64(amount)
  .encrypt();
```

**Run from `starter/`:**

```bash
npm run test:full -- --grep 'Confidential salary and permissions (?!.*(?:overflow|uint64 maximum))'
```

**Expected:** 11 salary/input/permission tests pass. The two overflow cases are deliberately held for step 7. Default starter npm test runs only the 3 baseline checks.

**Likely failure:** WORKSHOP_FULL_TESTS is not enabled, or a snapshot reset confuses the mock coprocessor cursor.

**Recovery:** Use test:full, not the baseline command. This suite uses fresh deployments, not loadFixture snapshots. Apply checkpoint 6 if necessary.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test)

## Step 7 — Confidential overflow safety

**Slide / concept:** Slide 10 — FHE Changes Some Solidity Assumptions

**Problem:** Encrypted uint64 addition wraps; Solidity 0.8 checked-arithmetic expectations do not protect it.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 7

**Explain:** “If candidate is smaller than previous, addition wrapped. That comparison is encrypted. select keeps previous on overflow and candidate otherwise; we reveal no overflow flag.”

**Code change:** Replace this TODO region with:

```solidity
euint64 updated = FHE.select(FHE.lt(candidate, previous), previous, candidate);
```

**Run from `starter/`:**

```bash
npm run test:full -- --grep 'Confidential salary and permissions'
```

**Expected:** All 13 salary and ACL tests pass, including exact uint64 maximum and overflow retaining the previous value.

**Likely failure:** The branches of select are reversed, or uint64 maximum is accidentally converted through JavaScript Number.

**Recovery:** Apply checkpoint 7. Use bigint in tests and token-unit conversion. Keep one employee per transaction to avoid unbounded FHE work.

**Docs:** [Official reference](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations)

## Step 8 — Frontend architecture and SDK client

**Slide / concept:** Slide 11 — Encrypt → Write → Decrypt, Part 1: SDK Configuration

**Problem:** The frontend needs browser cryptography, a wallet, chain access, and a clear secret boundary.

**Open:** `starter/frontend/lib/zama/client.ts`

**Complete:** TODO 8

**Explain:** “RainbowKit handles connection, Wagmi handles account/network state, and Viem handles chain calls. Our SDK setup is a browser-only helper. Sepolia needs no Relayer key; the server owns trusted configuration and any private RPC URL.”

**Code change:** Replace this TODO region with:

```ts
const [{ ZamaSDK, MemoryStorage }, { createConfig }, { web }, { sepolia }] =
  await Promise.all([
    import("@zama-fhe/sdk"),
    import("@zama-fhe/sdk/viem"),
    import("@zama-fhe/sdk/web"),
    import("@zama-fhe/sdk/chains"),
  ]);
return new ZamaSDK(
  createConfig({
    chains: [sepolia],
    publicClient,
    walletClient,
    relayers: { [sepolia.id]: web() },
    storage: new MemoryStorage(),
    permitTTL: 1,
    telemetry: false,
  }),
);
```

**Run from `starter/`:**

```bash
npm run typecheck
npm run dev -- --port 3001
```

**Expected:** The starter UI renders on localhost:3001; the completed solution can stay open on port 3000. SDK initialization occurs only on an explicit action after connection.

**Likely failure:** window is not defined, the SDK is eagerly initialized during SSR, or the wallet is on another chain.

**Recovery:** Apply checkpoint 8. Keep the dynamic imports and switch to Sepolia. The current @zama-fhe/sdk replaces the deprecated Relayer SDK.

**Docs:** [Official reference](https://docs.zama.org/protocol/sdk/guides/configuration)

## Step 9 — Encrypt 5000 before sending it

**Slide / concept:** Slide 11 — Encrypt → Write → Decrypt, Part 2: Encrypt Salary

**Problem:** A confidential contract cannot undo plaintext already broadcast in transaction transaction input.

**Open:** `starter/frontend/lib/zama/encryption.ts`

**Complete:** TODO 9

**Explain:** “The amount becomes six-decimal bigint units, then an euint64 encrypted for this payroll address and connected employer. Only encrypted value and input proof go into the transaction.”

**Code change:** Replace this TODO region with:

```ts
const encrypted = await sdk.encrypt({
  values: [{ value: amount, type: "euint64" }],
  contractAddress,
  userAddress: senderAddress,
});
const encryptedValue = encrypted.encryptedValues[0];
if (!encryptedValue) throw new Error("Encryption returned no salary handle.");
return { encryptedValue, inputProof: encrypted.inputProof };
```

**Run from `starter/`:**

```bash
npm run typecheck
```

**Expected:** The helper returns a contract-ready encrypted hex value and inputProof. No plaintext salary goes through a Next.js API route.

**Likely failure:** WASM/Worker loading fails, cross-origin isolation headers are missing, or a disconnected address reaches encryption.

**Recovery:** Apply checkpoint 9. Keep COOP/COEP headers, use localhost or HTTPS, reconnect the wallet, and retry. Never substitute a fake Sepolia input.

**Docs:** [Official reference](https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt)

## Step 10 — Submit encrypted salary with Viem

**Slide / concept:** Slide 11 — Encrypt → Write → Decrypt, Part 3: Contract Write

**Problem:** We have an encrypted input; now the contract must receive its exact arguments.

**Open:** `starter/frontend/lib/contracts/write-salary.ts`

**Complete:** TODO 10

**Explain:** “Wallet setup and transaction tracking are complete. The important write arguments are employee, encrypted value, and the proof from the same encryption. The employer signs the transaction.”

**Code change:** Replace this TODO region with:

```ts
return walletClient.writeContract({
  chain: sepolia,
  account: sender,
  address: payrollAddress,
  abi: payrollAbi,
  functionName: action,
  args: [employee, encryptedValue, inputProof],
});
```

**Run from `starter/`:**

```bash
npm run typecheck
```

**Expected:** Connect employer, enter the second wallet address and 5000, then Set salary. UI progresses through Encrypting, Waiting for wallet, Confirming, and Salary updated.

**Likely failure:** User rejects a request, gas is missing, an old deployment is configured, or proof verification reverts.

**Recovery:** Apply checkpoint 10. Check the transaction link before resubmitting. Fix the network/account/configuration and encrypt a fresh input.

**Docs:** [Official reference](https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt)

## Step 11 — The employee views their salary

**Slide / concept:** Slide 11 — Encrypt → Write → Decrypt, Part 4: Employee Decryption

**Problem:** The salary is already encrypted onchain. The employee now asks to view the value they may access.

**Open:** `starter/frontend/lib/zama/decryption.ts`

**Complete:** TODO 11

**Explain:** “We read salaryOf for the connected wallet, then ask the SDK for user decryption. The wallet signs an EIP-712 viewing permit if necessary. This is separate from the salary-setting transaction.”

**Code change:** Replace this TODO region with:

```ts
const values = await sdk.decryption.decryptValues([
  { encryptedValue, contractAddress },
]);
const amount = values[encryptedValue];
if (typeof amount !== "bigint")
  throw new Error("The Relayer did not return a valid amount.");
return amount;
```

**Run from `starter/`:**

```bash
npm run typecheck
```

**Expected:** Switch to employee and click View my salary. The private value appears after authorization; Hide removes it. Changing account/chain remounts the workspace and clears displayed private values.

**Likely failure:** Wrong employee account, stale handle/permit, or a Relayer delay after transaction confirmation.

**Recovery:** Apply checkpoint 11. Check account and ACL, wait briefly and click again. Use the completed solution if a frontend step blocks the room.

**Docs:** [Official reference](https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt)

## Step 12 — Confidential payroll payment

**Slide / concept:** Slide 13 — From Encrypted Salary to Confidential Payment

**Problem:** A private salary record does not pay anybody; use standard confidential money.

**Open:** `starter/contracts/ConfidentialPayroll.sol`

**Complete:** TODO 12

**Explain:** “The treasury owns ERC-7984 balances. We temporarily let the token contract use the encrypted amount, call confidentialTransfer, and retain the encrypted unpaid remainder. A mined transaction may have transferred zero, so we privately verify settlement.”

**Code change:** Replace this TODO region with:

```solidity
FHE.allowTransient(due, address(token));
euint64 transferred = token.confidentialTransfer(employee, due);
```

**Run from `starter/`:**

```bash
npm run compile
npm run test:full
```

**Expected:** All 31 tests pass. Duplicate attempt arguments revert; a funded retry settles the same period without double payment.

**Likely failure:** allowTransient is missing, the treasury has insufficient funds, or the UI calls an older deployed contract.

**Recovery:** Apply checkpoint 12. Fund payroll through Assets, use the same YYYYMM period for retry, and verify the transaction/deployment. Source edits do not update deployed bytecode.

**Docs:** [Official reference](https://docs.openzeppelin.com/confidential-contracts/api/token)

## Step 13 — Shield the payroll treasury

**Slide / concept:** Slide 14 — Shield → Pay → Unshield

**Problem:** Public ERC-20 tokens must enter the official confidential wrapper before payroll can spend them.

**Open:** `starter/frontend/hooks/use-assets.ts`

**Complete:** TODO 13

**Explain:** “This part is prepared code. We approve an exact amount and wrap to payroll, not to the employer wallet. The deposit amount is public; the following payroll transfer amount is encrypted.”

**Code change:** Replace this TODO region with:

```ts
const recipient = shieldToPayroll ? deployment.payroll : address;
await session.confirmTransaction(
  await walletClient.writeContract({
    chain: sepolia,
    account: address,
    address: deployment.wrapper,
    abi: wrapperAbi,
    functionName: "wrap",
    args: [recipient, amount],
  }),
);
```

**Run from `starter/`:**

```bash
node ../workshop-guide/scripts/checkpoint.mjs 13 --apply
npm run typecheck
```

**Expected:** With the deployed solution: Get practice tokens → Shield → enter 6000 → Send to: Payroll treasury → Shield tokens. Employer approves and wraps in two transactions; then pays the employee. Payroll funds stay in the contract. Assets shows the connected wallet's separate shielded balance with View/Hide controls. For personal shielding, choose My wallet in Send to. As employer, show Payroll shielded balance → View balance. Its first view may require an authorization transaction before private decryption. Hide it afterward; a deposit or payment may require fresh authorization. This prepared helper is outside the numbered TODOs.

**Likely failure:** Tokens were shielded to the personal wallet, public balance is insufficient, or only the approval transaction completed.

**Recovery:** Use the completed Assets code; check recipient and both receipts. Shield additional tokens directly to payroll and retry the existing payment period.

**Docs:** [Official reference](https://docs.openzeppelin.com/confidential-contracts/token)

## Step 14 — Unshield and finalize

**Slide / concept:** Slide 14 — Shield → Pay → Unshield

**Problem:** Encrypted balance cannot be released as public ERC-20 until a proof-checked withdrawal amount is available.

**Open:** `starter/frontend/hooks/use-assets.ts`

**Complete:** TODO 14

**Explain:** “The employee requests unwrap with an encrypted amount. The wrapper makes only its withdrawal amount publicly decryptable. Later, finalizeUnwrap checks that public result and its proof before releasing ERC-20.”

**Code change:** Replace this TODO region with:

```ts
const result = await publicDecryptWithdrawal(await session.getSdk(), requestId);
const clearAmount = result.clearValues[requestId];
if (typeof clearAmount !== "bigint")
  throw new Error("Withdrawal amount is not available yet.");
session.setStatus("Waiting for wallet… Finalize unshield.");
await session.confirmTransaction(
  await walletClient.writeContract({
    chain: sepolia,
    account: address,
    address: deployment.wrapper,
    abi: wrapperAbi,
    functionName: "finalizeUnwrap",
    args: [requestId, clearAmount, result.decryptionProof],
  }),
);
```

**Run from `starter/`:**

```bash
node ../workshop-guide/scripts/checkpoint.mjs 14 --apply
npm run typecheck
```

**Expected:** Switch to a gas-funded employee wallet; choose Unshield in Assets → enter 1000 → Request unshield. Complete a pending withdrawal opens with the request ID. Retain it, then Finalize unshield. Public wUSD rises only after the second transaction.

**Likely failure:** Relayer/KMS is still processing, the tab was refreshed, the wrong request ID was used, or finalization already happened.

**Recovery:** Recover the public ID from UnwrapRequested in the receipt, paste it, and retry only Finalize. The official wrapper fixes the receiver, so another caller cannot redirect funds.

**Docs:** [Official reference](https://docs.openzeppelin.com/confidential-contracts/api/token)

## Closing: slides 15–16, six minutes

**Slide 15 — Payroll Is Just One Example.** Return to the single payroll story: confidentiality is encrypted input, useful computation, and deliberate permissions, not anonymity. Builders can now apply the same sequence to lending, private balances, or treasury workflows.

**Slide 16 — Keep Building.** Open [resources/README.md](../resources/README.md). Assign employee-controlled auditor access. Require positive and negative decryption tests and a clear policy for updated salary handles. Do not implement the answer during the session.

## Performance and security cues to say aloud

- FHE arithmetic wraps. Solidity's checked uint64 example and FHE.add have different overflow behavior.
- A handle is public; ACL determines authorized use/viewing. Solidity private visibility is not data confidentiality.
- Every new encrypted result needs its own allowances. Permanent permissions on old handles are not revoked by replacing storage.
- Use the smallest practical encrypted type. euint64 matches ERC-7984 and allows about 18.4 trillion whole units at six decimals.
- HCU meters encrypted work separately from ordinary EVM gas. Avoid unbounded loops and explain one employee per transaction.
- Only unshield amounts are publicly decrypted. Do not “fix” a decryption failure by publishing salary.
- Settlement is verified from the encrypted remainder, not from a successful transaction status alone.
- Wallet addresses, payroll periods, timing, transaction sender, and shield/unshield amounts are public.
- Browser plaintext is intentionally visible to the authorized viewer and anyone observing their screen. Use practice salaries on stage; no logs or analytics receive them.

## Before going on stage

1. Run `npm run verify` in both `solution/` and `starter/`. From the repository root, run `node workshop-guide/scripts/check-workshop.mjs` to check that the two source trees and teaching steps still match. Keep dependencies installed.
2. From `solution/`, run `npm run check:sepolia` to check the network and deployed contracts.
3. From `solution/`, if you need another full chain check, run `npm run test:sepolia`. This sends transactions, funds a temporary employee with 0.006 Sepolia ETH, and refunds unused fees apart from a small reserve.
4. Rehearse the browser flow with employer and employee wallets. Both need Sepolia ETH for their own transactions.
5. Keep the completed solution open. Useful checkpoints: 5 = permissions, 7 = salary tests, 11 = private viewing, 12 = payment, 14 = Assets demo.

## If the live demo gets stuck

| Problem                                        | Next step                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Code no longer compiles                        | Apply the current checkpoint, then rerun its command.                                                                                      |
| Wallet is disconnected or on the wrong network | Connect through RainbowKit and switch to Sepolia. A browser extension needs no WalletConnect project ID.                                   |
| Wallet request was declined or timed out       | Check the transaction link before retrying; it may already be confirmed.                                                                   |
| Encrypted input is rejected                    | Reconnect the intended employer and encrypt again for the current payroll address. Keep the new handle with its matching proof.            |
| Employee cannot view salary                    | Check the employee address and permissions. Allow time for processing, then retry viewing. Keep salary private.                            |
| Payment confirms but remains unpaid            | Shield tokens to payroll, then retry the same period. A personal token balance does not fund payroll.                                      |
| Unshield is still processing                   | Keep the request ID and retry finalization later. After a refresh, recover the ID from the original transaction's `UnwrapRequested` event. |
| RPC or Relayer is unavailable                  | Continue with local contract tests and the completed source. Explain that the live network demo is unavailable.                            |
| Deployment runs out of ETH                     | Fund the same signer and rerun deployment. Preserve `solution/deployments/` so completed contracts are reused.                             |
| Browser encryption fails to start              | Use localhost or HTTPS, keep the configured COOP/COEP headers, and reload.                                                                 |

A source edit does not update a deployed contract. Use the existing solution deployment during the lesson, or deploy the completed starter separately.
