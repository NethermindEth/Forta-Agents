import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const FLEXA_MANAGER_CONTRACT: string = "0x706d7f8b3445d8dfc790c524e3990ef014e7c578";
const FLEXA_ABI: string[] = [
    "function partitions(bytes32) view returns (bool)",
];

export const AMP_CONTRACT: string = "0xff20817765cb7f73d4bde2e66e067e58d11095c2";
export const AMP_ABI: string[] = [
    "event TransferByPartition( bytes32 indexed fromPartition, address operator, address indexed from, address indexed to, uint256 value, bytes data, bytes operatorData )"
];

export const createFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Large FlexaCollateralManager TransferByPartition alert",
  description: "TransferByPartition event emitted with a large value",
  alertId: "FLEXA-3",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Flexa",
  metadata: {
    fromPartition: log.args['fromPartition'].toLowerCase(),
    operator: log.args['operator'].toLowerCase(),
    fromAddress: log.args['from'].toLowerCase(),
    toAddress: log.args['to'].toLowerCase(),
    value: log.args['value'].toString(),
  }
});

export default {
    FLEXA_MANAGER_CONTRACT,
    FLEXA_ABI,
    AMP_CONTRACT,
    AMP_ABI,  
    createFinding
};
