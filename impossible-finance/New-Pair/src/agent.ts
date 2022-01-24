import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from 'forta-agent';

import  {
  provideEventCheckerHandler,
  FindingGenerator,
  decodeParameter,
} from 'forta-agent-tools';

import { utils } from 'ethers';

// The Registry interface
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
]);

// The address of the Curve registry from curve.readthedocs.io
const SWAP_FACTORY_ADDRESS: string = '0x918d7e714243F7d9d463C37e106235dCde294ffC';

// Creates a finding generator to be used by provideEventCheckerHandler
const createFindingGenerator = (alertId: string): FindingGenerator => 
  (metadata: { [key: string]: any } | undefined): Finding => {
    console.log(metadata);
    return Finding.fromObject({
      name: 'New pair created',
      description: 'A new pair has been created in Swap Factory V1',
      alertId: alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: 'Impossible Finance',
      metadata: {
        token_0: metadata!.topics[1],
        token_1: metadata!.topics[2],
      }
    });
  };

// Called for every transaction
// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (
  alertId: string,
  address: string,
): HandleTransaction => {
  return provideEventCheckerHandler(
    createFindingGenerator(alertId),
    SWAP_FACTORY_IFACE.getEvent('PairCreated').format('sighash'),
    address,
  );
}

export default {
  handleTransaction: provideHandleTransaction(
    "IMPOSSIBLE-1",
    SWAP_FACTORY_ADDRESS,
  )
}
