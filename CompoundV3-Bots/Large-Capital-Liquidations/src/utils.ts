import { ethers } from "forta-agent";

export interface NetworkData {
  cometContracts: Array<{
    address: string;
    deploymentBlock: number;
    baseLargeThreshold: string;
    monitoringListLength: number;
  }>;
  alertInterval: number;
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
