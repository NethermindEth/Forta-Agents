import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';

import {
  decodeParameters,
  FindingGenerator,
  provideEventCheckerHandler,
} from "forta-agent-tools";

import abi from '../utils/stable.swap.abi';
import createFinding from "../utils/create.finding";

// @ts-ignore
import abiDecoder from 'abi-decoder';
abiDecoder.addABI(abi);

export const REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE =
  'RemoveLiquidityImbalance(address,uint256[3],uint256[3],uint256,uint256)';

  const createFindingGenerator = (alertID: string): FindingGenerator => {
    return (metadata: { [key: string]: any } | undefined) => {
      const { 0: address, 4:token_supply } = decodeParameters(
        ["address","uint256[3]","uint256[3]","uint256", "uint256"],
        metadata?.data
      );
      return Finding.fromObject({
        name: "RemoveLiquidityImbalance event Detected",
        description: "RemoveLiquidityImbalance event emitted on pool",
        alertId: alertID,
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
        metadata: {
          provider: address,
          token_supply: token_supply,
        },
      });
    };
  };


export default function provideRemoveLiquidityImbalanceAgent(
  alertID: string,
  address: string
): HandleTransaction {
  const agentHandler = provideEventCheckerHandler(
    createFindingGenerator(alertID),
    REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
    address
  );
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    
    const findings: Finding[] = await agentHandler(txEvent);

    return findings;
  };

}
