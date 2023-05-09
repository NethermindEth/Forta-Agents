import { LogDescription, ethers } from "forta-agent";
import { MulticallProvider } from "forta-agent-tools";

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

export function getPotentialBorrowersFromLogs(logs: LogDescription[]): string[] {
  const addresses = new Set<string>();

  logs.forEach((log) => {
    switch (log.name) {
      case "Supply":
        addresses.add(log.args.dst);
        break;
      case "Withdraw":
        addresses.add(log.args.src);
        break;
      case "AbsorbDebt":
        addresses.add(log.args.borrower);
        break;
    }
  });

  return Array.from(addresses);
}

export async function multicallAll(
  multicallProvider: MulticallProvider,
  ...params: Parameters<MulticallProvider["all"]>
) {
  const resp = await multicallProvider.tryAll(...params);

  const failIndex = resp.findIndex((call) => !call.success);
  if (failIndex !== -1) {
    throw new Error("At least one call in a multicall all failed: " + JSON.stringify(params[0][failIndex]));
  }

  return resp.map((call) => call.returnData);
}
