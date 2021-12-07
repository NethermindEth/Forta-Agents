/*
The following is a transaction on the Ethereum mainnet that should create a finding

https://etherscan.io/tx/0x0ccbffa23dff7d7c47dcdaed14c3d98aab5e4c63d531d8e243365745cbb1484e

Run `npm run tx <TxId>` to test with a particular TX
*/

import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

import {
  provideEventCheckerHandler,
  FindingGenerator,
} from "forta-agent-tools";

// The signature of the NewFee event
export const NEW_FEE_EVENT_SIG = "NewFee(uint256,uint256)";

// The address of the Pool Owner (PoolProxy.vy)
const POOL_PROXY_ADDRESS = "0xeCb456EA5365865EbAb8a2661B0c503410e9B347";

// Creates a finding generator to be used by provideEventCheckerHandler
const createFindingGenerator = (alertId: string): FindingGenerator =>
  (metadata: { [key: string]: any } | undefined): Finding => 
    Finding.fromObject({
      name: 'CurveDAO Pool Owner contract called',
      description: 'Function NewFee executed',
      alertId: alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        // The pool that had its fee changed
        affected_pool: metadata!.address,
        // The topic
        topic: metadata!.topics[0],
        // The data
        data: metadata!.data,
      },
    });

// Called for every transaction
// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (
  alertId: string,
  address: string,
): HandleTransaction => provideEventCheckerHandler(
  createFindingGenerator(alertId),
  NEW_FEE_EVENT_SIG,
  address,
);

export default {
  handleTransaction: provideHandleTransaction(
    'CURVE-2',
    POOL_PROXY_ADDRESS,
  ),
}
