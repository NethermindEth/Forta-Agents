import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { EVENTS_ABI, GET_USER_ACCOUNT_DATA_ABI } from "./constants";

export interface AgentConfig {
  lendingPoolAddress: string;
}
const LENDING_POOL_IFACE = new Interface([...EVENTS_ABI, ...GET_USER_ACCOUNT_DATA_ABI]);
ethers.utils.parseEther("11").gt;
const getUserAddressFromEvent = (logs: LogDescription) => {
  if (logs.name === "Deposit") {
    return logs.args.onBehalfOf;
  }
  if (logs.name === "Withdraw" || logs.name === "Swap" || logs.name === "Borrow") {
    return logs.args.user;
  }
  if (logs.name === "FlashLoan") {
    return logs.args.target;
  }
};
interface IUserData {
  logs: LogDescription;
  lendingPoolAddress: string;
  provider: ethers.providers.Provider;
  blockNumber: number;
}
const getUserData = async ({ logs, lendingPoolAddress, provider, blockNumber }: IUserData) => {
  const userAddress = getUserAddressFromEvent(logs);
  const contract = await new ethers.Contract(lendingPoolAddress, GET_USER_ACCOUNT_DATA_ABI, provider);
  return await contract.getUserAccountData(userAddress, { blockTag: blockNumber });
};
interface IMetaData {
  collateralAmount: string;
  borrowAmount: string;
}
const createFinding = ({ collateralAmount, borrowAmount }: IMetaData): Finding => {
  return Finding.fromObject({
    name: "Detect bad debt immediately after market interaction",
    description: "",
    alertId: "UMEE-11",
    protocol: "Umee",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    metadata: {
      collateralAmount,
      borrowAmount,
    },
  });
};

export default {
  LENDING_POOL_IFACE,
  getUserData,
  createFinding,
};
