import { Interface } from "@ethersproject/abi";
import {
  Finding,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

interface MetaDataI {
  previousFee: string;
  currentFee: string;
}
const REFLECT_TOKEN_ADDRESS: string =
  "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299";

const EVENT_ABI: string[] = [
  "event UpdateTaxFee(uint256 previousTaxFee, uint256 newTaxFee)",
];
const WRONG_EVENT_ABI: string[] = [
  "event Transfer(address indexed from,address indexed to,uint256 value)",
];

const TRANSACTIONS_ABI: string[] = [
  "function updateTaxFee(uint256 _fee) public",
];

const EVENTS_IFACE: Interface = new Interface(EVENT_ABI);
const WRONG_EVENTS_IFACE: Interface = new Interface(WRONG_EVENT_ABI);

const TRANSACTIONS_IFACE: Interface = new Interface(TRANSACTIONS_ABI);

const provider = getEthersProvider();

const createFinding = (metaData: MetaDataI): Finding => {
  return Finding.fromObject({
    name: "Detect Fees Related To The Token",
    description: `token tax fee has been changed`,
    alertId: "APESWAP-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      previousFee: metaData.previousFee,
      currentFee: metaData.currentFee,
    },
  });
};

export default {
  REFLECT_TOKEN_ADDRESS,
  WRONG_EVENTS_IFACE,
  EVENT_ABI,
  EVENTS_IFACE,
  TRANSACTIONS_IFACE,
  createFinding,
  provider,
};
