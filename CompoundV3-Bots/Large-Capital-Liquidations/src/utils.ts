import { ethers } from "forta-agent";

export interface NetworkData {
  cometContracts: Array<{
    address: string;
    deploymentBlock: number;
    baseLargeThreshold: string;
    monitoringListLength: number;
  }>;
  alertInterval: number;
  multicallSize: number;
  logFetchingBlockRange: number;
  logFetchingInterval: number;
}

export interface BorrowPosition {
  borrower: string;
  principal: ethers.BigNumber;
  alertedAt: number;
}

export interface AgentState {
  initialized: boolean;
  monitoringLists: Record<string, Array<BorrowPosition>>;
  lastHandledBlock: number;
}

export type AgentConfig = Record<number, NetworkData>;

export function addPositionsToMonitoringList(
  state: AgentState,
  comet: string,
  monitoringListLength: number,
  positions: BorrowPosition[],
  threshold: ethers.BigNumber,
  baseBorrowIndex: ethers.BigNumber,
  baseIndexScale: ethers.BigNumber
) {
  const monitoringList = state.monitoringLists[comet] || [];
  const monitoringListMap = Object.fromEntries(monitoringList.map((el, idx) => [el.borrower, idx]));

  positions.forEach((position) => {
    if (monitoringListMap[position.borrower] !== undefined) {
      monitoringList[monitoringListMap[position.borrower]] = position;
    } else {
      monitoringList.push(position);
    }
  });

  // ascending sorting because borrows are negative
  monitoringList.sort((a, b) => (a.principal.lt(b.principal) ? -1 : a.principal.eq(b.principal) ? 0 : 1));

  state.monitoringLists[comet] = monitoringList.slice(0, monitoringListLength);
  checkMonitoringListHealth(state, comet, monitoringListLength, threshold, baseBorrowIndex, baseIndexScale);
}

export function checkMonitoringListHealth(
  state: AgentState,
  comet: string,
  monitoringListLength: number,
  threshold: ethers.BigNumber,
  baseBorrowIndex: ethers.BigNumber,
  baseIndexScale: ethers.BigNumber
) {
  const monitoringList = state.monitoringLists[comet];

  if (monitoringList.length < monitoringListLength) {
    return;
  }

  const minBalance = presentValueBorrow(monitoringList[monitoringList.length - 1], baseBorrowIndex, baseIndexScale);

  if (minBalance.gte(threshold)) {
    console.warn(
      `Monitoring list length ${monitoringListLength} is too short for the threshold ${threshold} for Comet ${comet}`
    );
  }
}

export function presentValueBorrow(
  position: BorrowPosition,
  baseBorrowIndex: ethers.BigNumber,
  baseIndexScale: ethers.BigNumber
) {
  return position.principal.isNegative()
    ? position.principal.mul(-1).mul(baseBorrowIndex).div(baseIndexScale)
    : ethers.BigNumber.from(0);
}
