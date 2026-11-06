import "dotenv/config";
import { readFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  http,
  erc20Abi,
  parseAbi,
  parseEther,
  parseEventLogs,
  BaseError,
  RpcRequestError,
  zeroHash,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { sepolia } from "viem/chains";
import { ZamaSDK, MemoryStorage } from "@zama-fhe/sdk";
import { createConfig } from "@zama-fhe/sdk/viem";
import { node } from "@zama-fhe/sdk/node";
import { sepolia as fheSepolia } from "@zama-fhe/sdk/chains";

// This command deliberately sends Sepolia transactions. It is never run by npm test.
let stage = "configuration";
const clients = [];
let refundEmployeeFees;
try {
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerPrivateKey || !/^0x[0-9a-fA-F]{64}$/.test(deployerPrivateKey))
    throw new Error("Configure the local Sepolia signer.");
  const employer = privateKeyToAccount(deployerPrivateKey);
  const employee = privateKeyToAccount(generatePrivateKey());
  const deployment = JSON.parse(
    await readFile(new URL("../frontend/deployment.json", import.meta.url), "utf8"),
  );
  if (
    deployment.chainId !== sepolia.id ||
    employer.address.toLowerCase() !== deployment.employer.toLowerCase()
  )
    throw new Error("Signer or chain does not match deployment.json.");
  const transport = http(
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  );
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const employeeFeeFunding = parseEther("0.006");
  if ((await publicClient.getBalance({ address: employer.address })) <= employeeFeeFunding)
    throw new Error("Fund the deployer with enough Sepolia ETH for rehearsal transactions.");
  const walletClient = createWalletClient({ chain: sepolia, account: employer, transport });
  const employeeWallet = createWalletClient({ chain: sepolia, account: employee, transport });
  const sdk = new ZamaSDK(
    createConfig({
      chains: [fheSepolia],
      publicClient,
      walletClient,
      relayers: { [sepolia.id]: node() },
      storage: new MemoryStorage(),
      telemetry: false,
      permitTTL: 1,
    }),
  );
  const employeeSdk = new ZamaSDK(
    createConfig({
      chains: [fheSepolia],
      publicClient,
      walletClient: employeeWallet,
      relayers: { [sepolia.id]: node() },
      storage: new MemoryStorage(),
      telemetry: false,
      permitTTL: 1,
    }),
  );
  clients.push(sdk, employeeSdk);
  const payrollAbi = parseAbi([
    "function setSalary(address,bytes32,bytes)",
    "function addBonus(address,bytes32,bytes)",
    "function salaryOf(address) view returns (bytes32)",
    "function pay(address,uint64,uint64)",
    "function treasuryBalance() view returns (bytes32 balance,bool employerCanView)",
    "function allowTreasuryBalanceViewing()",
    "function paymentState(address,uint64) view returns ((bytes32 remaining,bytes32 lastTransferred,uint64 attempts,bool started))",
  ]);
  const wrapperAbi = parseAbi([
    "function wrap(address,uint256) returns (bytes32)",
    "function confidentialBalanceOf(address) view returns (bytes32)",
    "function unwrap(address,address,bytes32,bytes) returns (bytes32)",
    "function finalizeUnwrap(bytes32,uint64,bytes)",
    "event UnwrapRequested(address indexed receiver,bytes32 indexed unwrapRequestId,bytes32 amount)",
  ]);
  let confirmedBlockNumber;
  async function confirm(hash) {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 180_000,
    });
    if (receipt.status !== "success") throw new Error("Transaction reverted.");
    confirmedBlockNumber = receipt.blockNumber;
    return receipt;
  }
  async function retryDelegatedAccountLimit(submit) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        return await submit();
      } catch (error) {
        const isPendingAccountLimit =
          error instanceof BaseError &&
          error.walk(
            (cause) =>
              cause instanceof RpcRequestError &&
              cause.details?.includes("in-flight transaction limit reached for delegated accounts"),
          ) instanceof RpcRequestError;
        if (!isPendingAccountLimit || attempt === 7) throw error;
        if (attempt === 0)
          console.info("Waiting for the RPC to clear the previous confirmed transaction…");
        await new Promise((resolve) => setTimeout(resolve, 4_000));
      }
    }
  }
  async function nextNonce(wallet) {
    return publicClient.getTransactionCount({
      address: wallet.account.address,
      ...(confirmedBlockNumber === undefined
        ? { blockTag: "pending" }
        : { blockNumber: confirmedBlockNumber }),
    });
  }
  async function sendContract(wallet, parameters) {
    const nonce = await nextNonce(wallet);
    // A known mempool rejection can be retried, always keeping the same nonce.
    return retryDelegatedAccountLimit(() => wallet.writeContract({ ...parameters, nonce }));
  }
  async function sendTransaction(wallet, parameters) {
    const nonce = await nextNonce(wallet);
    return retryDelegatedAccountLimit(() => wallet.sendTransaction({ ...parameters, nonce }));
  }
  async function retryDecryption(client, contractAddress, encryptedValue) {
    for (let attempt = 0; attempt < 16; attempt++) {
      try {
        return await client.decryption.decryptValues([{ encryptedValue, contractAddress }]);
      } catch (error) {
        if (attempt === 15) throw error;
        await new Promise((resolve) => setTimeout(resolve, 5_000));
      }
    }
  }
  async function verifyTreasuryBalance(expectedAmount) {
    const readBalance = () =>
      publicClient.readContract({
        blockNumber: confirmedBlockNumber,
        address: deployment.payroll,
        abi: payrollAbi,
        functionName: "treasuryBalance",
      });
    let [balanceHandle, canView] = await readBalance();
    if (!canView) {
      await confirm(
        await sendContract(walletClient, {
          address: deployment.payroll,
          abi: payrollAbi,
          functionName: "allowTreasuryBalanceViewing",
        }),
      );
      [balanceHandle, canView] = await readBalance();
    }
    if (!canView) throw new Error("Treasury viewing authorization failed.");
    const values =
      balanceHandle === zeroHash
        ? { [balanceHandle]: 0n }
        : await retryDecryption(sdk, deployment.wrapper, balanceHandle);
    if (expectedAmount !== undefined && values[balanceHandle] !== expectedAmount)
      throw new Error("Private treasury balance verification failed.");
    return values[balanceHandle];
  }
  const tokenUnit = 10n ** 6n;
  stage = "encrypted salary";
  const salary = await sdk.encrypt({
    values: [{ value: 5_000n * tokenUnit, type: "euint64" }],
    contractAddress: deployment.payroll,
    userAddress: employer.address,
  });
  await confirm(
    await sendContract(walletClient, {
      address: deployment.payroll,
      abi: payrollAbi,
      functionName: "setSalary",
      args: [employee.address, salary.encryptedValues[0], salary.inputProof],
    }),
  );
  stage = "confidential bonus";
  const bonus = await sdk.encrypt({
    values: [{ value: 500n * tokenUnit, type: "euint64" }],
    contractAddress: deployment.payroll,
    userAddress: employer.address,
  });
  await confirm(
    await sendContract(walletClient, {
      address: deployment.payroll,
      abi: payrollAbi,
      functionName: "addBonus",
      args: [employee.address, bonus.encryptedValues[0], bonus.inputProof],
    }),
  );
  stage = "authorized employee decryption";
  const handle = await publicClient.readContract({
    blockNumber: confirmedBlockNumber,
    address: deployment.payroll,
    abi: payrollAbi,
    functionName: "salaryOf",
    args: [employee.address],
  });
  const decryptedSalary = await retryDecryption(employeeSdk, deployment.payroll, handle);
  if (decryptedSalary[handle] !== 5_500n * tokenUnit)
    throw new Error("Salary verification failed.");
  console.info("PASS: real encrypted input, confidential bonus, and employee user decryption.");
  stage = "initial treasury balance";
  const initialTreasuryBalance = await verifyTreasuryBalance();
  console.info("PASS: current treasury balance authorization and private decryption.");
  stage = "practice token claim";
  await confirm(
    await sendContract(walletClient, {
      address: deployment.publicToken,
      abi: parseAbi(["function faucet()"]),
      functionName: "faucet",
    }),
  );
  stage = "public token approval";
  await confirm(
    await sendContract(walletClient, {
      address: deployment.publicToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [deployment.wrapper, 6_000n * tokenUnit],
    }),
  );
  stage = "shield";
  await confirm(
    await sendContract(walletClient, {
      address: deployment.wrapper,
      abi: wrapperAbi,
      functionName: "wrap",
      args: [deployment.payroll, 6_000n * tokenUnit],
    }),
  );
  stage = "employer treasury viewing after shield";
  await verifyTreasuryBalance(initialTreasuryBalance + 6_000n * tokenUnit);
  console.info("PASS: employer-only authorization and private treasury balance decryption.");
  stage = "confidential payment";
  const period = BigInt(Math.floor(Date.now() / 1000));
  await confirm(
    await sendContract(walletClient, {
      address: deployment.payroll,
      abi: payrollAbi,
      functionName: "pay",
      args: [employee.address, period, 0n],
    }),
  );
  const receipt = await publicClient.readContract({
    blockNumber: confirmedBlockNumber,
    address: deployment.payroll,
    abi: payrollAbi,
    functionName: "paymentState",
    args: [employee.address, period],
  });
  const paymentValues = await retryDecryption(sdk, deployment.payroll, receipt.remaining);
  if (receipt.remaining === zeroHash || paymentValues[receipt.remaining] !== 0n)
    throw new Error("Payment did not settle.");
  const balanceHandle = await publicClient.readContract({
    blockNumber: confirmedBlockNumber,
    address: deployment.wrapper,
    abi: wrapperAbi,
    functionName: "confidentialBalanceOf",
    args: [employee.address],
  });
  const balance = await retryDecryption(employeeSdk, deployment.wrapper, balanceHandle);
  if (balance[balanceHandle] !== 5_500n * tokenUnit)
    throw new Error("Employee token balance verification failed.");
  stage = "employer treasury viewing after payment";
  await verifyTreasuryBalance(initialTreasuryBalance + 500n * tokenUnit);
  console.info("PASS: treasury viewing uses the updated balance after payment.");
  console.info(
    "PASS: shield, confidential payment, zero remaining liability, and employee balance decryption.",
  );
  stage = "unshield request";
  // Bound fee funding for the temporary test wallet; refund its unused ETH below.
  await confirm(
    await sendTransaction(walletClient, { to: employee.address, value: employeeFeeFunding }),
  );
  refundEmployeeFees = async () => {
    const gasPrice = await publicClient.getGasPrice();
    const refundGas = await publicClient.estimateGas({
      account: employee,
      to: employer.address,
      value: 1n,
    });
    const feeReserve = (refundGas * gasPrice * 12n) / 10n;
    const remainingEth = await publicClient.getBalance({ address: employee.address });
    if (remainingEth > feeReserve)
      await confirm(
        await sendTransaction(employeeWallet, {
          to: employer.address,
          value: remainingEth - feeReserve,
          gas: refundGas,
          gasPrice,
        }),
      );
  };
  const withdrawal = await employeeSdk.encrypt({
    values: [{ value: 1_000n * tokenUnit, type: "euint64" }],
    contractAddress: deployment.wrapper,
    userAddress: employee.address,
  });
  const unwrapReceipt = await confirm(
    await sendContract(employeeWallet, {
      address: deployment.wrapper,
      abi: wrapperAbi,
      functionName: "unwrap",
      args: [
        employee.address,
        employee.address,
        withdrawal.encryptedValues[0],
        withdrawal.inputProof,
      ],
    }),
  );
  const requestId = parseEventLogs({
    abi: wrapperAbi,
    eventName: "UnwrapRequested",
    logs: unwrapReceipt.logs.filter(
      (log) => log.address.toLowerCase() === deployment.wrapper.toLowerCase(),
    ),
  })[0]?.args.unwrapRequestId;
  if (!requestId) throw new Error("Withdrawal request event missing.");
  const publicBalanceBefore = await publicClient.readContract({
    blockNumber: confirmedBlockNumber,
    address: deployment.publicToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [employee.address],
  });
  if (publicBalanceBefore !== 0n)
    throw new Error("Public tokens were released before finalization.");
  stage = "public withdrawal decryption";
  let publicResult;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      publicResult = await sdk.decryption.decryptPublicValues([requestId]);
      break;
    } catch (error) {
      if (attempt === 11) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
  const clearAmount = publicResult.clearValues[requestId];
  if (clearAmount !== 1_000n * tokenUnit) throw new Error("Withdrawal verification failed.");
  stage = "proof-checked unshield finalization";
  await confirm(
    await sendContract(walletClient, {
      address: deployment.wrapper,
      abi: wrapperAbi,
      functionName: "finalizeUnwrap",
      args: [requestId, clearAmount, publicResult.decryptionProof],
    }),
  );
  const publicBalanceAfter = await publicClient.readContract({
    blockNumber: confirmedBlockNumber,
    address: deployment.publicToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [employee.address],
  });
  if (publicBalanceAfter !== 1_000n * tokenUnit)
    throw new Error("Finalized public balance verification failed.");
  console.info(
    "PASS: asynchronous unwrap, public decryption proof, finalizeUnwrap, and public token release.",
  );
  stage = "temporary wallet fee refund";
  await refundEmployeeFees();
  refundEmployeeFees = undefined;
  console.info(
    "PASS: live shield → pay → unshield rehearsal complete; unused temporary-wallet fee funding refunded apart from a small gas reserve.",
  );
} catch (error) {
  // SDK errors can contain private application context. Do not serialize them.
  const categories = [];
  for (
    let cause = error, depth = 0;
    cause && typeof cause === "object" && depth < 4;
    cause = cause.cause, depth++
  ) {
    // Only contract RPC errors contain public transaction data; never print SDK error details.
    const rpcReason =
      error?.name === "ContractFunctionExecutionError" &&
      cause.name === "RpcRequestError" &&
      typeof cause.details === "string"
        ? cause.details.replace(/0x[0-9a-fA-F]+/g, "[hex]").slice(0, 240)
        : undefined;
    categories.push({
      name: cause.name,
      code: cause.code,
      status: cause.status,
      rpcReason,
    });
  }
  console.error(
    `Live check failed during ${stage}. Error categories: ${JSON.stringify(categories)}. No plaintext or key material was logged.`,
  );
  process.exitCode = 1;
} finally {
  if (refundEmployeeFees) {
    try {
      await refundEmployeeFees();
    } catch {
      console.error(
        "Temporary test-wallet fee refund could not be confirmed. The bounded testnet fee funding may remain in that account.",
      );
    }
  }
  for (const client of clients) client.terminate();
}

// All requests and transactions above are awaited. The shared Node WASM pool can
// otherwise keep a finished CLI alive after SDK-owned resources are released.
process.exit(process.exitCode ?? 0);
