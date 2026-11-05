export const todos = [
  {
    number: 1,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/v0.11/smart-contract/configure",
  },
  {
    number: 2,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/types",
  },
  {
    number: 3,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs",
  },
  {
    number: 4,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/operations",
  },
  {
    number: 5,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/acl",
  },
  {
    number: 6,
    file: "test/ConfidentialPayroll.ts",
    docs: "https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test",
  },
  {
    number: 7,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/operations",
  },
  {
    number: 8,
    file: "frontend/lib/zama/client.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/configuration",
  },
  {
    number: 9,
    file: "frontend/lib/zama/encryption.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt",
  },
  {
    number: 10,
    file: "frontend/lib/contracts/write-salary.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt",
  },
  {
    number: 11,
    file: "frontend/lib/zama/decryption.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt",
  },
  {
    number: 12,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.openzeppelin.com/confidential-contracts/api/token",
  },
  {
    number: 13,
    file: "frontend/hooks/use-assets.ts",
    docs: "https://docs.openzeppelin.com/confidential-contracts/token",
  },
  {
    number: 14,
    file: "frontend/hooks/use-assets.ts",
    docs: "https://docs.openzeppelin.com/confidential-contracts/api/token",
  },
];

export function regionPattern(number) {
  return new RegExp(
    `(^[ \\t]*// @workshop:start ${number}\\r?\\n)([\\s\\S]*?)(^[ \\t]*// @workshop:end ${number}$)`,
    "m",
  );
}
