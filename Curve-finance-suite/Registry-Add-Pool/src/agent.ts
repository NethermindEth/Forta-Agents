import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from 'forta-agent';

import  {
  provideEventCheckerHandler,
  FindingGenerator,
} from 'forta-agent-tools';

// The signature of the `PoolAdded` event
export const ADD_POOL_SIGNATURE = "PoolAdded(address,bytes)";

// The address of the Curve registry from curve.readthedocs.io
const REGISTRY_ADDRESS: string = '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5';

// Creates a finding generator to be used by provideEventCheckerHandler
const createFindingGenerator = (alertId: string): FindingGenerator =>
  (metadata: { [key: string]: any } | undefined): Finding => 
    Finding.fromObject({
      name: 'Curve Registry contract called',
      description: 'Event PoolAdded has been emitted',
      alertId: alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: 'Curve Finance',
      metadata: {
        // The address of the pool that was added
        pool_address: metadata!.topics[1],
      }
    });

// Called for every transaction
// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (
  alertId: string,
  address: string,
): HandleTransaction => provideEventCheckerHandler(
  createFindingGenerator(alertId),
  ADD_POOL_SIGNATURE,
  address,
);

export default {
  handleTransaction: provideHandleTransaction(
    "CURVE-13",
    REGISTRY_ADDRESS,
  )
}
