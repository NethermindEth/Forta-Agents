import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";

const provider = getEthersProvider();
const DECREASE_POSITION_EVENT = "DecreasePosition";

const EVENT_ABI: string[] = [
  "event DecreasePosition(bytes32 key,address account,address collateralToken,address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,uint256 price,uint256 fee)",
];

const EVENTS_IFACE: Interface = new Interface(EVENT_ABI);

const createFinding = (account: string, numberOfClosing: string): Finding => {
  return Finding.fromObject({
    name: "Detects many position closing from an account within a time-frame",
    description: `Account: ${account} closed ${numberOfClosing} positions`,
    alertId: "GMX-4",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    protocol: "GMX",
    metadata: {
      account,
      numberOfClosing,
    },
  });
};

export default {
  provider,
  DECREASE_POSITION_EVENT,
  EVENT_ABI,
  EVENTS_IFACE,
  createFinding,
};
