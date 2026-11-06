export const todos = [
  {
    number: 1,
    slide: 5,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/v0.11/smart-contract/configure",
  },
  {
    number: 2,
    slide: 5,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/types",
  },
  {
    number: 3,
    slide: 6,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs",
  },
  {
    number: 4,
    slide: 7,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/operations",
  },
  {
    number: 5,
    slide: 8,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/acl",
  },
  {
    number: 6,
    slide: 9,
    file: "test/ConfidentialPayroll.ts",
    docs: "https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test",
  },
  {
    number: 7,
    slide: 10,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.zama.org/protocol/solidity-guides/smart-contract/operations",
  },
  {
    number: 8,
    slide: 11,
    part: 1,
    file: "frontend/lib/zama/client.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/configuration",
  },
  {
    number: 9,
    slide: 11,
    part: 2,
    file: "frontend/lib/zama/encryption.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt",
  },
  {
    number: 10,
    slide: 11,
    part: 3,
    file: "frontend/lib/contracts/write-salary.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt",
  },
  {
    number: 11,
    slide: 11,
    part: 4,
    file: "frontend/lib/zama/decryption.ts",
    docs: "https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt",
  },
  {
    number: 12,
    slide: 13,
    file: "contracts/ConfidentialPayroll.sol",
    docs: "https://docs.openzeppelin.com/confidential-contracts/api/token",
  },
  {
    number: 13,
    slide: 14,
    file: "frontend/hooks/use-assets.ts",
    docs: "https://docs.openzeppelin.com/confidential-contracts/token",
  },
  {
    number: 14,
    slide: 14,
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
