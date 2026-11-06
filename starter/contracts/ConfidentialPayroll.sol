/* solhint-disable no-unused-import, no-unused-vars */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ConfidentialPayroll is
    // Slide 5 | Step 1: Configure confidential Solidity.
    // @workshop:start 1
    // TODO 1: Inherit the Zama configuration before ReentrancyGuard.
    // Docs: https://docs.zama.org/protocol/solidity-guides/v0.11/smart-contract/configure
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

    error WorkshopTodo(uint8 number);
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
        // Slide 6 | Step 3: Verify encrypted salary input.
        // @workshop:start 3
        // TODO 3: Verify the external encrypted salary and proof with FHE.fromExternal.
        // Docs: https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs
        euint64 value = _unfinishedValue(3);
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
        // Slide 7 | Step 4: Add an encrypted bonus.
        // @workshop:start 4
        // TODO 4: Add the encrypted salary and bonus with FHE.add.
        // Docs: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations
        euint64 candidate = _unfinishedValue(4);
        // @workshop:end 4
        // Slide 10 | Step 7: Handle encrypted overflow.
        // @workshop:start 7
        // TODO 7: Use an encrypted comparison and FHE.select to keep the old salary on overflow.
        // Docs: https://docs.zama.org/protocol/solidity-guides/smart-contract/operations
        // Deliberately unsafe until this step: FHE addition wraps modulo 2^64.
        euint64 updated = candidate;
        // @workshop:end 7
        salaries[employee] = updated;
        _grant(updated, employee);
        emit SalaryUpdated(employee);
    }

    function salaryOf(address employee) external view returns (euint64) {
        // Slide 5 | Step 2: Read an encrypted salary.
        // @workshop:start 2
        // TODO 2: Return the saved encrypted salary handle for this employee.
        // Docs: https://docs.zama.org/protocol/solidity-guides/smart-contract/types
        if (FHE.isInitialized(salaries[employee])) return _unfinishedValue(2);
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
        // Slide 13 | Step 12: Pay with confidential tokens.
        // @workshop:start 12
        // TODO 12: Let the token use the encrypted amount for this transaction, then transfer it.
        // Docs: https://docs.openzeppelin.com/confidential-contracts/api/token
        euint64 transferred = _unfinishedValue(12);
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

    // Slide 14 | Prepared demo: read payroll's balance and its viewing permission.
    function treasuryBalance() public view returns (euint64 balance, bool employerCanView) {
        balance = token.confidentialBalanceOf(address(this));
        employerCanView = !FHE.isInitialized(balance) || FHE.isAllowed(balance, employer);
    }

    /// @notice Authorize private viewing of the current treasury balance, without moving tokens.
    /// @dev Deposits and payments create a new balance handle that may need a new grant.
    function allowTreasuryBalanceViewing() external onlyEmployer {
        (euint64 balance, ) = treasuryBalance();
        if (FHE.isInitialized(balance)) FHE.allow(balance, employer);
    }

    function _grant(euint64 value, address employee) internal {
        // Slide 8 | Step 5: Grant salary permissions.
        // @workshop:start 5
        // TODO 5: Allow payroll to reuse the value and the employee and employer to view it.
        // Docs: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl
        _unfinishedValue(5);
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
    function _unfinishedValue(uint8 step) internal pure returns (euint64) {
        if (step != 0) revert WorkshopTodo(step);
        return euint64.wrap(bytes32(0));
    }
}
