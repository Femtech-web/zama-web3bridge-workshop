import type { DeployFunction } from "hardhat-deploy/types";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const deploy: DeployFunction = async (hardhat) => {
  const { deployer } = await hardhat.getNamedAccounts();
  if (!deployer)
    throw new Error("Set DEPLOYER_PRIVATE_KEY in solution/.env to a funded Sepolia test wallet.");
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
  const publicToken = await hardhat.deployments.deploy("WorkshopUSD", deploymentOptions);
  const wrapper = await hardhat.deployments.deploy("ConfidentialWorkshopUSD", {
    ...deploymentOptions,
    args: [publicToken.address],
  });
  const payroll = await hardhat.deployments.deploy("ConfidentialPayroll", {
    ...deploymentOptions,
    args: [deployer, wrapper.address],
  });
  const chainId = Number(await hardhat.getChainId());
  const output = {
    chainId,
    employer: deployer,
    payroll: payroll.address,
    publicToken: publicToken.address,
    wrapper: wrapper.address,
    deployedAt: new Date().toISOString(),
  };
  await writeFile(resolve("frontend/deployment.json"), JSON.stringify(output, null, 2) + "\n");
  console.info(
    `Deployment configuration written for chain ${chainId}. Run preflight:sepolia before rehearsal.`,
  );
};
deploy.tags = ["Payroll"];
export default deploy;
