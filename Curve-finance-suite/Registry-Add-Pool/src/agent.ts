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
export const R_IFACE: utils.Interface = new utils.Interface([
  'event PoolAdded(address indexed pool, bytes rate_method_id)'
]);

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
	pool_address: decodeParameter('address', metadata!.topics[1]).toLowerCase(),
      }
    });

// Called for every transaction
// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (
  alertId: string,
  address: string,
): HandleTransaction => {
  return provideEventCheckerHandler(
    createFindingGenerator(alertId),
    R_IFACE.getEvent('PoolAdded').format('sighash'),
    address,
  );
}

export default {
  handleTransaction: provideHandleTransaction(
    "CURVE-13",
    REGISTRY_ADDRESS,
  )
}
