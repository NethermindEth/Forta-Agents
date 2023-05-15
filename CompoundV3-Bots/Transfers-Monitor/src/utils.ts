import { BigNumberish } from "ethers";

export interface NetworkData {
  cometContracts: CometData[];
}

export type AgentConfig = Record<number, NetworkData>;

export type TransferLog = {
  from: string;
  destinationComet: CometData;
  amount: BigNumberish;
};

export type CometData = { address: string; baseToken: string };
