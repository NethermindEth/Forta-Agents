import { Interface } from "@ethersproject/abi";
import {
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

interface MetaDataI {
  feeType: "tax" | "reflect";
  previousFee: string;
  currentFee: string;
}
const REFLECT_TOKEN_ADDRESS: string =
  "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299";

const REFLECT_TRANSACTION: string = "function reflect(uint256 tAmount)";

const EVENT_ABI: string[] = [
  "event UpdateTaxFee(uint256 previousTaxFee, uint256 newTaxFee)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

enum EVENTS_NAME {
  UpdateTaxFee = "UpdateTaxFee",
  Transfer = "Transfer",
}

const EVENTS_IFACE: Interface = new Interface(EVENT_ABI);

const TRANSACTIONS_IFACE: ethers.utils.Interface = new ethers.utils.Interface([
  "function reflect(uint256 tAmount) external",
]);

const provider = getEthersProvider();

const createFinding = (metaData: MetaDataI): Finding => {
  return Finding.fromObject({
    name: "Detect Fees Related To The Token",
    description: `token ${metaData.feeType} fee has been changed`,
    alertId: "APESWAP-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      feeType: metaData.feeType,
      previousFee: metaData.previousFee,
      currentFee: metaData.currentFee,
    },
  });
};

export default {
  REFLECT_TOKEN_ADDRESS,
  REFLECT_TRANSACTION,
  EVENT_ABI,
  EVENTS_IFACE,
  EVENTS_NAME,
  createFinding,
  provider,
  TRANSACTIONS_IFACE,
};
