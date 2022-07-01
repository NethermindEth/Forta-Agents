import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

interface MetaDataI {
  previousFee: string;
  currentFee: string;
}
const GNANA_TOKEN_ADDRESS: string =
  "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299";

const EVENT_ABI: string[] = [
  "event UpdateTaxFee(uint256 previousTaxFee, uint256 newTaxFee)",
];

const EVENTS_IFACE: Interface = new Interface(EVENT_ABI);

const createFinding = (metaData: MetaDataI): Finding => {
  return Finding.fromObject({
    name: "Detect Fees Changes Related To The GNANA Token",
    description: "GNANA Token tax fee has been changed",
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
  GNANA_TOKEN_ADDRESS,
  EVENT_ABI,
  EVENTS_IFACE,
  createFinding,
};
