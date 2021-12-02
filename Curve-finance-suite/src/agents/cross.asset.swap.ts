import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import createFinding from "../utils/create.finding";

export const CROSS_CHAIN_SWAP_SIGNATURE =
  'TokenUpdate(uint256,address,address,uint256)';

export default function provideCrossAssetSwap(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    if (txEvent.filterEvent(CROSS_CHAIN_SWAP_SIGNATURE, address).length > 0) {
      findings.push(createFinding(
        "CrossChainSwap funciton called",
        "CrossChainSwap funciton called on pool",
        alertID,
        FindingSeverity.Low,
        FindingType.Suspicious,
        { data: address }
      ));
    }

    return findings;
  };
}
