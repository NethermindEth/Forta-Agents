import { Interface } from "@ethersproject/abi";
import {
  Finding,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

const provider = getEthersProvider();
const positionsNumber = 500; // arbitrum generate 15 block per second thus to get number of blocks in one minute 60s/15 = 4 block
const GMX_VAULT_ADDRESS: string = "0x489ee077994B6658eAfA855C308275EAd8097C4A"; // Arbitrum address
const INCREASE_POSITION_EVENT =
  "event IncreasePosition(bytes32 key,address account,address collateralToken,address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,uint256 price,uint256 fee)";

const EVENT_ABI: string[] = [INCREASE_POSITION_EVENT];

const EVENTS_IFACE: Interface = new Interface(EVENT_ABI);

const createFinding = (account: string): Finding => {
  return Finding.fromObject({
    name: "Detects many position openings from an account within a time-frame",
    description: "Certain account opened unusual positions within a time-frame",
    alertId: "GMX-3",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    protocol: "GMX",
    metadata: {
      account,
    },
  });
};

export default {
  provider,
  GMX_VAULT_ADDRESS,
  INCREASE_POSITION_EVENT,
  EVENT_ABI,
  EVENTS_IFACE,
  positionsNumber,
  createFinding,
};
