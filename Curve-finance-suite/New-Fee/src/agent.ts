import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

import {
  provideFunctionCallsDetectorHandler,
  FindingGenerator,
} from "forta-agent-tools";

import { utils } from 'ethers';

// Interface containing relevant functions for this agent
export const POOL_PROXY_IFACE: utils.Interface = new utils.Interface([
  'function apply_new_fee(address pool) external view returns ()',
]);

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
      protocol: 'Curve Finance',
      metadata: {
        affected_pool: metadata?.arguments[0],
        sender: metadata?.from
      },
    });

// Called for every transaction and returns a list of findings
export const provideHandleTransaction = (
  alertId: string,
  address: string,
): HandleTransaction => 
  provideFunctionCallsDetectorHandler(
    createFindingGenerator(alertId),
    POOL_PROXY_IFACE.getFunction('apply_new_fee').format('sighash'),
    {
      to: address,
    }
  );

export default {
  handleTransaction: provideHandleTransaction(
    'CURVE-14',
    POOL_PROXY_ADDRESS,
  ),
}
