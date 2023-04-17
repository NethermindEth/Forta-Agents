import { BigNumber } from "ethers";

export interface NetworkData {
  cometAddresses: string[];
  alertFrequency: number;
}

export type AgentConfig = Record<number, NetworkData>;

export function abs(num: BigNumber) {
  return num.gte(0) ? num : BigNumber.from(-num);
}
