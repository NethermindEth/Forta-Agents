import { BigNumber } from "ethers";

export interface NetworkData {
  cometAddresses: string[]; // List of comet contract adddresses for each network.
  alertFrequency: number; // Frequency of emitting alerts for the same contract.
}

export type AgentConfig = Record<number, NetworkData>;

export function abs(num: BigNumber) {
  return num.gte(0) ? num : BigNumber.from(-num);
}
