import type { DeployFunction } from "hardhat-deploy/types";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const deploy: DeployFunction = async (hardhat) => {
  const { deployer } = await hardhat.getNamedAccounts();
  if (!deployer)
    throw new Error(
      "Set DEPLOYER_PRIVATE_KEY in this project's .env to a funded Sepolia test wallet.",
    );
  const intendedEmployer = process.env.WORKSHOP_EMPLOYER_ADDRESS || deployer;
  if (intendedEmployer.toLowerCase() !== deployer.toLowerCase())
    throw new Error(
      "The local signer does not match WORKSHOP_EMPLOYER_ADDRESS. Check the dedicated test wallet.",
    );
  const deploymentOptions = {
    from: deployer,
    log: true,
    waitConfirmations: hardhat.network.name === "sepolia" ? 2 : 1,
  };
  // Keep existing token balances when replacing payroll; token deployments are immutable.
  const publicToken =
    (await hardhat.deployments.getOrNull("WorkshopUSD")) ??
    (await hardhat.deployments.deploy("WorkshopUSD", deploymentOptions));
  const wrapper =
    (await hardhat.deployments.getOrNull("ConfidentialWorkshopUSD")) ??
    (await hardhat.deployments.deploy("ConfidentialWorkshopUSD", {
      ...deploymentOptions,
      args: [publicToken.address],
    }));
  const wrapperContract = await hardhat.ethers.getContractAt(
    "ConfidentialWorkshopUSD",
    wrapper.address,
  );
  if ((await wrapperContract.underlying()).toLowerCase() !== publicToken.address.toLowerCase())
    throw new Error(
      "Saved token deployments do not match. Restore their original records before deploying payroll.",
    );
  const previousDeployment = await hardhat.deployments.getOrNull("ConfidentialPayroll");
  let previousPayroll: string | undefined;
  try {
    const previousConfig = JSON.parse(await readFile("frontend/deployment.json", "utf8"));
    previousPayroll = previousConfig.previousPayroll;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  const payroll = await hardhat.deployments.deploy("ConfidentialPayroll", {
    ...deploymentOptions,
    args: [deployer, wrapper.address],
  });
  if (previousDeployment && previousDeployment.address !== payroll.address) {
    previousPayroll = previousDeployment.address;
    await hardhat.deployments.save(
      `ConfidentialPayroll_${previousDeployment.address}`,
      previousDeployment,
    );
  }
  const chainId = Number(await hardhat.getChainId());
  const output = {
    chainId,
    employer: deployer,
    payroll: payroll.address,
    publicToken: publicToken.address,
    wrapper: wrapper.address,
    treasuryViewing: true,
    previousPayroll,
    deployedAt: new Date().toISOString(),
    transactions: {
      WorkshopUSD: publicToken.transactionHash,
      ConfidentialWorkshopUSD: wrapper.transactionHash,
      ConfidentialPayroll: payroll.transactionHash,
    },
  };
  await writeFile(resolve("frontend/deployment.json"), JSON.stringify(output, null, 2) + "\n");
  console.info(
    `Deployment configuration written for chain ${chainId}. Run check:sepolia before rehearsal.`,
  );
  if (previousPayroll)
    console.info(
      `Previous payroll preserved at ${previousPayroll}; its funds and records stay there.`,
    );
};
deploy.tags = ["Payroll"];
export default deploy;
