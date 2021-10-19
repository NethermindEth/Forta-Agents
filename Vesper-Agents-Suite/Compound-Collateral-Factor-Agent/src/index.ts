import {
  Finding, FindingSeverity,
  FindingType, HandleTransaction,
  TransactionEvent
} from 'forta-agent';
import {
  FindingGenerator,
  provideEventCheckerHandler
} from 'forta-agent-tools';
import Web3 from 'web3';
import { COLLATERAL_FACTOR_EVENT_ALERT_ID, COMPOUND_COMPTROLLER_ADDRESS, NEW_COLLATERAL_FACTOR_SIGNATURE } from './utils';

const web3 = new Web3();

const createFindingGenerator = (): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) => {
    const { 2: newCollateralFactorMantissa } = web3.eth.abi.decodeParameters(
      ['address', 'uint256', 'uint256'],
      metadata?.data,
    );
    return Finding.fromObject({
      name: 'COMPOUND NEW COLLATERAL FACTOR EVENT',
      description: 'Updated collateral factor mantissa for Compound',
      alertId: COLLATERAL_FACTOR_EVENT_ALERT_ID,
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'Compound',
      metadata: {
        mantissa: newCollateralFactorMantissa,
      }
    })
  }
}

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const agentHandler = provideEventCheckerHandler(
    createFindingGenerator(),
    NEW_COLLATERAL_FACTOR_SIGNATURE,
    COMPOUND_COMPTROLLER_ADDRESS,
  );

  return agentHandler(txEvent);
}

export default {
  handleTransaction,
}