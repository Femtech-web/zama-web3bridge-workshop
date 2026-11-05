// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @notice Slide reference only. Public state and calldata reveal every salary.
contract PublicPayroll {
    address public immutable employer = msg.sender;
    mapping(address employee => uint64 amount) public salaryOf;

    error OnlyEmployer();

    modifier onlyEmployer() {
        if (msg.sender != employer) revert OnlyEmployer();
        _;
    }

    function setSalary(address employee, uint64 salary) external onlyEmployer {
        salaryOf[employee] = salary;
    }

    function addBonus(address employee, uint64 bonus) external onlyEmployer {
        salaryOf[employee] += bonus;
    }
}
