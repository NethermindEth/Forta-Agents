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

export const REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE =
  "RemoveLiquidiityImbalance(address, uint256[3], uint256[3],uint256, uint256)";

const createFinding = (alertID: string, address: string): Finding => {
  return Finding.fromObject({
    name: "RemoveLiquidityImbalance funciton called",
    description: "RemoveLiquidityImbalance funciton called on pool",
    alertId: alertID,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      data: address,
    },
  });
};

export default function provideRemoveLiquidityImbalanceAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    if (
      txEvent.filterEvent(REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE, address)
        .length > 0
    ) {
      findings.push(createFinding(alertID, address));
    }

    return findings;
  };
}
