// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

// Slide 12 | Prepared reference: public tokens used for shielding and unshielding.
/// @notice Valueless workshop tokens. The public faucet is deliberately testnet-only.
contract WorkshopUSD is ERC20 {
    constructor() ERC20("Workshop USD", "wUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function faucet() external {
        require(block.chainid == 31337 || block.chainid == 11155111, "Test networks only");
        _mint(msg.sender, 100_000 * 10 ** 6);
    }
}

// Slide 12 | Prepared reference: compare this confidential wrapper with the public token above.
/// @notice Official wrapper implementation; no custom balance or money logic.
contract ConfidentialWorkshopUSD is ZamaEthereumConfig, ERC7984ERC20Wrapper {
    constructor(
        address underlying_
    ) ERC7984("Confidential Workshop USD", "cwUSD", "") ERC7984ERC20Wrapper(IERC20(underlying_)) {}
}
