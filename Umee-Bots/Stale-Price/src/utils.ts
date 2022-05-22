import { Interface } from "@ethersproject/abi";

import { Finding, FindingSeverity, FindingType } from "forta-agent";

const LENDING_POOL_ADDRESS = "0x3526a2fe5dA32d0f0814086848628bF12A1E4417";

const UMEE_FUNCTIONS_ABI: string[] = [
  "function getReservesList() external view override returns (address[] memory)",
  "function getSourceOfAsset(address asset) external view returns (address",
];

const FUNCTIONS_INTERFACE = new Interface(UMEE_FUNCTIONS_ABI);

const getAssetSourceLatestTimeStamp = async()=>{

}

const createFinding = (initialCallSelector: string, lendingPoolCallSelector: string): Finding => {
  return Finding.fromObject({
    name: "Detect stale price data from Chainlink aggregator",
    description: "Stale price data is detected from Chainlink aggregator",
    alertId: "UMEE-3",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    metadata: {
      initialCallSelector,
      lendingPoolCallSelector,
    },
  });
};

export default {
  LENDING_POOL_ADDRESS,
  FUNCTIONS_INTERFACE,
  UMEE_FUNCTIONS_ABI,
  createFinding,
};
