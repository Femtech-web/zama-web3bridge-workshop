import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "dotenv/config";
import { subtask, type HardhatUserConfig } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";

// Pin the local compiler so a rehearsal does not depend on solc-bin availability.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async ({ solcVersion }, _hre, next) => {
  if (solcVersion !== "0.8.27") return next();
  return {
    compilerPath: require.resolve("solc/soljson.js"),
    isSolcJs: true,
    version: solcVersion,
    longVersion: "0.8.27+commit.40a35a09",
  };
});

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (deployerPrivateKey && !/^0x[0-9a-fA-F]{64}$/.test(deployerPrivateKey))
  throw new Error("DEPLOYER_PRIVATE_KEY must be a 0x-prefixed 32-byte private key.");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: { deployer: 0 },
  solidity: {
    version: "0.8.27",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    anvil: { url: "http://127.0.0.1:8545", chainId: 31337 },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
    },
  },
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY || "" },
  typechain: { outDir: "types", target: "ethers-v6" },
  mocha: { timeout: 120000 },
};
export default config;
