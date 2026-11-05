import "dotenv/config";
import { ethers } from "hardhat";
import { readFile } from "node:fs/promises";

async function main() {
  const { sepolia } = await import("@zama-fhe/sdk/chains");
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111n) throw new Error("Expected Sepolia chain ID 11155111.");
  const source = await readFile(require.resolve("@fhevm/solidity/config/ZamaConfig.sol"), "utf8");
  const sepoliaConfig = source
    .split("function _getSepoliaConfig()")[1]
    ?.split("function _getLocalProtocolId()")[0];
  if (!sepoliaConfig)
    throw new Error("Could not inspect the installed Solidity Sepolia configuration.");
  const addresses = [...sepoliaConfig.matchAll(/0x[0-9a-fA-F]{40}/g)].map(([address]) =>
    ethers.getAddress(address),
  );
  if (
    !addresses.includes(ethers.getAddress(sepolia.aclContractAddress)) ||
    !addresses.includes(ethers.getAddress(sepolia.kmsContractAddress))
  ) {
    throw new Error(
      "SDK and Solidity host-chain addresses differ. Stop and verify package compatibility.",
    );
  }
  for (const address of new Set([...addresses, sepolia.inputVerifierContractAddress])) {
    if ((await ethers.provider.getCode(address)) === "0x")
      throw new Error(`No protocol bytecode at ${address}.`);
  }
  console.info("PASS: Sepolia chain, SDK/Solidity configuration parity, and protocol bytecode.");
  const employer = process.env.WORKSHOP_EMPLOYER_ADDRESS;
  if (employer) {
    if (!ethers.isAddress(employer)) throw new Error("WORKSHOP_EMPLOYER_ADDRESS is invalid.");
    console.info(
      `Rehearsal employer: ${ethers.getAddress(employer)}; Sepolia ETH: ${ethers.formatEther(await ethers.provider.getBalance(employer))}`,
    );
  }
  let deployment;
  try {
    deployment = JSON.parse(await readFile("frontend/deployment.json", "utf8"));
  } catch {
    console.info(
      "PENDING: No application deployment yet. Configure a local signer, then run deploy:sepolia.",
    );
    return;
  }
  for (const field of ["payroll", "publicToken", "wrapper"] as const) {
    const address: unknown = deployment[field];
    if (
      typeof address !== "string" ||
      !ethers.isAddress(address) ||
      (await ethers.provider.getCode(address)) === "0x"
    )
      throw new Error(`Invalid deployed ${field}.`);
  }
  const payroll = await ethers.getContractAt("ConfidentialPayroll", deployment.payroll);
  const wrapper = await ethers.getContractAt("ConfidentialWorkshopUSD", deployment.wrapper);
  if ((await payroll.employer()).toLowerCase() !== deployment.employer.toLowerCase())
    throw new Error("Employer configuration mismatch.");
  if ((await payroll.token()).toLowerCase() !== deployment.wrapper.toLowerCase())
    throw new Error("Payroll token mismatch.");
  if ((await wrapper.underlying()).toLowerCase() !== deployment.publicToken.toLowerCase())
    throw new Error("Wrapper underlying mismatch.");
  console.info("PASS: Application bytecode, employer, payroll token, and wrapper underlying.");
  console.info(
    "Run test:sepolia to verify real encryption, permissions, and user decryption before calling this deployment known-good.",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Deployment check failed.");
  process.exitCode = 1;
});
