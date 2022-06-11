import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { EVENTS_ABI, GET_USER_ACCOUNT_DATA_ABI } from "./constants";

export interface AgentConfig {
  lendingPoolAddress: string;
}

const EVENTS_IFACE = new Interface(EVENTS_ABI);

const FUNCTIONS_IFACE = new Interface(GET_USER_ACCOUNT_DATA_ABI);

const getUserAddressFromEvent = (log: LogDescription) => {
  if (log.name === "Deposit" || log.name === "Borrow") {
    return log.args.onBehalfOf;
  }

  if (log.name === "Withdraw" || log.name === "Swap") {
    return log.args.user;
  }

  if (log.name === "FlashLoan") {
    return log.args.target;
  }
};

interface UserData {
  log: LogDescription;
  lendingPoolAddress: string;
  provider: ethers.providers.Provider;
  blockNumber: number;
}

const getUserData = async ({ log, lendingPoolAddress, provider, blockNumber }: UserData) => {
  const userAddress = getUserAddressFromEvent(log);
  const contract = new ethers.Contract(lendingPoolAddress, GET_USER_ACCOUNT_DATA_ABI, provider);
  return await contract.getUserAccountData(userAddress, { blockTag: blockNumber });
};

interface MetaData {
  collateralAmount: ethers.BigNumber;
  borrowAmount:  ethers.BigNumber;
}

const createFinding = ({ collateralAmount, borrowAmount }: MetaData): Finding => {
  return Finding.fromObject({
    name: "Bad debt immediately after market interaction",
    description: "A user is currently with a bad debt after a market interaction",
    alertId: "UMEE-11",
    protocol: "Umee",
    type: FindingType.Exploit,
    severity: FindingSeverity.High,
    metadata: {
      collateralAmount: ethers.utils.formatEther(collateralAmount).toString(),
      borrowAmount: ethers.utils.formatEther(borrowAmount).toString(),
    },
  });
};

export default {
  EVENTS_IFACE,
  FUNCTIONS_IFACE,
  getUserData,
  createFinding,
};
