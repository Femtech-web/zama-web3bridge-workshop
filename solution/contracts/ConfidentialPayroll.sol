// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ConfidentialPayroll is
    // @workshop:start 1
    ZamaEthereumConfig,
    // @workshop:end 1
    ReentrancyGuard
{
    address public immutable employer;
    IERC7984 public immutable token;

    mapping(address employee => euint64 salary) private salaries;

    struct Payment {
        euint64 remaining;
        euint64 lastTransferred;
        uint64 attempts;
        bool started;
    }

    mapping(address employee => mapping(uint64 period => Payment)) private payments;

    error OnlyEmployer();
    error InvalidAddress();
    error SalaryNotSet();
    error InvalidPeriod();
    error StaleAttempt(uint64 expected, uint64 actual);

    event SalaryUpdated(address indexed employee);
    event PaymentAttempted(address indexed employee, uint64 indexed period, uint64 attempt);

    modifier onlyEmployer() {
        if (msg.sender != employer) revert OnlyEmployer();
        _;
    }

    constructor(address employer_, address token_) {
        if (employer_ == address(0) || token_.code.length == 0) revert InvalidAddress();
        employer = employer_;
        token = IERC7984(token_);
    }

    function setSalary(
        address employee,
        externalEuint64 encryptedSalary,
        bytes calldata inputProof
    ) external onlyEmployer {
        _validEmployee(employee);
        // @workshop:start 3
        euint64 value = FHE.fromExternal(encryptedSalary, inputProof);
        // @workshop:end 3
        salaries[employee] = value;
        _grant(value, employee);
        emit SalaryUpdated(employee);
    }

    function addBonus(
        address employee,
        externalEuint64 encryptedBonus,
        bytes calldata inputProof
    ) external onlyEmployer {
        _requireSalary(employee);
        euint64 bonus = FHE.fromExternal(encryptedBonus, inputProof);
        euint64 previous = salaries[employee];
        // @workshop:start 4
        euint64 candidate = FHE.add(previous, bonus);
        // @workshop:end 4
        // @workshop:start 7
        euint64 updated = FHE.select(FHE.lt(candidate, previous), previous, candidate);
        // @workshop:end 7
        salaries[employee] = updated;
        _grant(updated, employee);
        emit SalaryUpdated(employee);
    }

    function salaryOf(address employee) external view returns (euint64) {
        // @workshop:start 2
        return salaries[employee];
        // @workshop:end 2
    }

    /// @notice Snapshot salary per public payroll period. Retry only the unpaid remainder.
    /// @dev ERC-7984 can transfer encrypted zero on insufficient funds without reverting.
    function pay(
        address employee,
        uint64 period,
        uint64 expectedAttempt
    ) external onlyEmployer nonReentrant {
        _requireSalary(employee);
        if (period == 0) revert InvalidPeriod();
        Payment storage payment = payments[employee][period];
        if (payment.attempts != expectedAttempt)
            revert StaleAttempt(expectedAttempt, payment.attempts);
        if (!payment.started) {
            payment.started = true;
            payment.remaining = salaries[employee];
        }
        payment.attempts++;
        euint64 due = payment.remaining;
        // @workshop:start 12
        FHE.allowTransient(due, address(token));
        euint64 transferred = token.confidentialTransfer(employee, due);
        // @workshop:end 12
        payment.lastTransferred = transferred;
        payment.remaining = FHE.sub(due, transferred);
        _grant(payment.lastTransferred, employee);
        _grant(payment.remaining, employee);
        emit PaymentAttempted(employee, period, expectedAttempt);
    }

    function paymentState(address employee, uint64 period) external view returns (Payment memory) {
        return payments[employee][period];
    }

    function _grant(euint64 value, address employee) internal {
        // @workshop:start 5
        FHE.allowThis(value);
        FHE.allow(value, employee);
        FHE.allow(value, employer);
        // @workshop:end 5
    }

    function _validEmployee(address employee) internal view {
        if (employee == address(0) || employee == address(this) || employee == employer)
            revert InvalidAddress();
    }

    function _requireSalary(address employee) internal view {
        _validEmployee(employee);
        if (!FHE.isInitialized(salaries[employee])) revert SalaryNotSet();
    }
}
