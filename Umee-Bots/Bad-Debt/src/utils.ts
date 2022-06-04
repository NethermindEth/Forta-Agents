import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { EVENTS_ABI, GET_USER_ACCOUNT_DATA_ABI } from "./constants";

export interface AgentConfig {
  lendingPoolAddress: string;
}
const EVENTS_IFACE = new Interface(EVENTS_ABI);

const FUNCTIONS_IFACE = new Interface(GET_USER_ACCOUNT_DATA_ABI);

const getUserAddressFromEvent = (logs: LogDescription) => {
  if (logs.name === "Deposit" || logs.name === "Borrow") {
    return logs.args.onBehalfOf;
  }

  if (logs.name === "Withdraw") {
    return logs.args.to;
  }

  if (logs.name === "Swap") {
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
    description: `User has collaterals ${collateralAmount} and borrowed more ${borrowAmount}`,
    alertId: "UMEE-11",
    protocol: "Umee",
    type: FindingType.Exploit,
    severity: FindingSeverity.High,
    metadata: {
      collateralAmount,
      borrowAmount,
    },
  });
};

export default {
  EVENTS_IFACE,
  FUNCTIONS_IFACE,
  getUserData,
  createFinding,
};
