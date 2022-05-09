import { BigNumber, utils } from "ethers";

export const THRESHOLD: BigNumber = BigNumber.from("500000000000000000000"); // 500,000 USDC

export const SCHED_BORROW_ALLOC_CHANGE_EVENT: string = `event ScheduledBorrowerAllocationChange(
    address indexed borrower,
    uint256 oldAllocation,
    uint256 newAllocation,
    uint256 epochNumber
  )`;

export const MODULE_IFACE: utils.Interface = new utils.Interface([SCHED_BORROW_ALLOC_CHANGE_EVENT]);