import { Interface } from "@ethersproject/abi";
import {
  Finding,
  FindingSeverity,
  FindingType,
  LogDescription,
} from "forta-agent";

const TIMELOCKV2_SECURE: string = "0x211cBF06441BeB429677a011eAd947Eb6716054E";
const TIMELOCKV2_GENERAL: string = "0xA0528d54E722eDDA62A844431dCE7Ebb1c70325e";

const EVENT_ABI: string =
  "event MinDelayChange(uint256 oldDuration, uint256 newDuration)";
const EVENT_IFACE: Interface = new Interface([EVENT_ABI]);

const createFinding = (log: LogDescription, name: string): Finding => {
  return Finding.fromObject({
    name: "Timelock - Min delay changed",
    description: `Min delay changed on Apeswap's ${name} contract`,
    alertId: "APESWAP-12",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      oldDuration: log.args.oldDuration.toString(),
      newDuration: log.args.newDuration.toString(),
    },
  });
};

export default {
  TIMELOCKV2_SECURE,
  TIMELOCKV2_GENERAL,
  EVENT_ABI,
  EVENT_IFACE,
  createFinding,
};
