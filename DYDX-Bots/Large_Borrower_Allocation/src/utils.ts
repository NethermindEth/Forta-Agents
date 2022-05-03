import { BigNumber } from "ethers";

export const PROXY_ADDRESS: string = "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941";
export const THRESHOLD: BigNumber = BigNumber.from("500000000000000000000"); // 500,000

export const SCHED_BORROW_ALLOC_CHANGE_EVENT: string = `event ScheduledBorrowerAllocationChange(
    address indexed borrower,
    uint256 oldAllocation,
    uint256 newAllocation,
    uint256 epochNumber
  )`;
export const SCHED_BORROW_ALLOC_CHANGE_SIG: string =
  "ScheduledBorrowerAllocationChange(address,uint256,uint256,uint256)";
