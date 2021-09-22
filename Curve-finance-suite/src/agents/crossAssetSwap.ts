import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import abi from "../utils/stable-swap-abi";

// @ts-ignore
import abiDecoder from "abi-decoder";
abiDecoder.addABI(abi);

export const CROSS_CHAIN_SWAP_SIGNATURE =
  "TokenUpdate(uint256,address, address, uint256)";

const createFinding = (alertID: string, address: string): Finding => {
  return Finding.fromObject({
    name: "CrossChainSwap funciton called",
    description: "CrossChainSwap funciton called on pool",
    alertId: alertID,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      address: address,
    },
  });
};

export default function provideCrossAssetSwap(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    if (txEvent.filterEvent(CROSS_CHAIN_SWAP_SIGNATURE, address).length > 0) {
      findings.push(createFinding(alertID, address));
    }

    return findings;
  };
}
