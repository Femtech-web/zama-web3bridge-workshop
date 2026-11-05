# Keep building

Start with the workshop's [architecture](../workshop-guide/ARCHITECTURE.md) and [live guide](../workshop-guide/LIVE_WORKSHOP.md). Use the official links below when continuing after the workshop.

| Topic                   | Official resource                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Protocol                | [Zama Protocol docs](https://docs.zama.org/protocol)                                                                               |
| Architecture            | [FHE on blockchain](https://docs.zama.org/protocol/protocol/overview)                                                              |
| Solidity                | [FHEVM Solidity guide](https://docs.zama.org/protocol/solidity-guides)                                                             |
| Configuration           | [Compatible v0.11 configuration](https://docs.zama.org/protocol/solidity-guides/v0.11/smart-contract/configure)                    |
| Types                   | [Supported encrypted types](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)                                   |
| Handles                 | [Ciphertext handles](https://docs.zama.org/protocol/solidity-guides/smart-contract/handles)                                        |
| Inputs                  | [Encrypted external inputs and fromExternal](https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs)                 |
| Arithmetic              | [FHE operations and overflow-safe select](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations)                |
| Permissions             | [ACL: allow, allowThis, and allowTransient](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl)                     |
| Performance             | [HCU](https://docs.zama.org/protocol/solidity-guides/development-guide/hcu)                                                        |
| Tests                   | [Official Hardhat test approach](https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test)              |
| Current SDK             | [Zama SDK overview](https://docs.zama.org/protocol/sdk/overview)                                                                   |
| Browser setup           | [SDK configuration](https://docs.zama.org/protocol/sdk/guides/configuration)                                                       |
| Relayer SDK transition  | [Official deprecation and migration notice](https://github.com/zama-ai/relayer-sdk)                                                |
| User decryption         | [Current encryption and user decryption flow](https://docs.zama.org/protocol/sdk/guides/encrypt-decrypt)                           |
| Public decryption       | [Solidity public decryption](https://docs.zama.org/protocol/solidity-guides/smart-contract/oracle)                                 |
| Relayer credentials     | [Sepolia and mainnet authentication](https://docs.zama.org/protocol/sdk/guides/authentication)                                     |
| Next.js                 | [SDK SSR boundary](https://docs.zama.org/protocol/sdk/guides/nextjs-ssr)                                                           |
| ERC-7984                | [Token standard](https://eips.ethereum.org/EIPS/eip-7984)                                                                          |
| OpenZeppelin            | [Confidential Contracts](https://docs.openzeppelin.com/confidential-contracts)                                                     |
| Wrapper                 | [Current token and wrapper APIs](https://docs.openzeppelin.com/confidential-contracts/api/token)                                   |
| Deployments             | [Official protocol contract addresses](https://docs.zama.org/protocol/solidity-guides/smart-contract/configure/contract_addresses) |
| Sepolia ETH             | [Ethereum testnet resources](https://ethereum.org/en/developers/docs/networks/#sepolia)                                            |
| Faucet                  | [Google Cloud Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)                                   |
| Explorer                | [Sepolia Etherscan](https://sepolia.etherscan.io)                                                                                  |
| Community               | [Zama community](https://www.zama.org/community) · [Discord](https://discord.com/invite/zama)                                      |
| Try confidential assets | [Zama app](https://app.zama.org)                                                                                                   |

The public practice token in this repository has its own **Get practice tokens** faucet button. You still need Sepolia ETH to pay transaction fees.

## Bootcamp references

- [FHEVM Bootcamp OS](https://github.com/Femtech-web/FHEVM-Bootcamp-OS)
- [FHEVM Bootcamp Code](https://github.com/Femtech-web/FHEVM-Bootcamp-Code)

These repositories provide more exercises. Check current documentation before copying code: SDK setup, decryption, and wrapper APIs have changed since some older examples.

## Challenge: add auditor access

An employee should be able to explicitly authorize one trusted auditor to view that employee's current salary. Other employees and the public must remain unauthorized. Do not publish the salary or mark it publicly decryptable.

Acceptance criteria:

- The employee opts in; an unrelated account cannot grant access for them.
- The auditor can user-decrypt the intended salary handle.
- An unrelated wallet cannot decrypt it.
- Tests define what happens when the employer updates salary and produces a new handle.
- Explain that a permanent grant cannot make an already disclosed value secret again.

No auditor answer is implemented in the starter or solution. Explore [ACL](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl) and, for a harder alternative, [expiring user-decryption delegation](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl/delegation). Direct `FHE.allow` grants are permanent; do not invent a temporary `allow` API. A delegation is a different permission model and should be scoped and tested accordingly.

Optional extensions: confidential allowance, safe encrypted deduction, or a deliberately scoped temporary auditor delegation.
