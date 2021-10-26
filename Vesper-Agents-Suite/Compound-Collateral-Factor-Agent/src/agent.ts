import {
  Finding, FindingSeverity,
  FindingType, HandleTransaction,
  TransactionEvent
} from 'forta-agent';
import {
  decodeParameters,
  FindingGenerator,
  provideEventCheckerHandler
} from 'forta-agent-tools';
import { COLLATERAL_FACTOR_EVENT_ALERT_ID, COMPOUND_COMPTROLLER_ADDRESS, NEW_COLLATERAL_FACTOR_SIGNATURE } from './utils';

const createFindingGenerator = (alertId = COLLATERAL_FACTOR_EVENT_ALERT_ID): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) => {
    const { 2: newCollateralFactorMantissa } = decodeParameters(
      ['address', 'uint256', 'uint256'],
      metadata?.data,
    );
    return Finding.fromObject({
      name: 'COMPOUND NEW COLLATERAL FACTOR EVENT',
      description: 'Updated collateral factor mantissa for Compound',
      alertId,
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: 'Compound',
      metadata: {
        mantissa: newCollateralFactorMantissa,
      }
    })
  }
}

const handleTransaction: HandleTransaction = provideEventCheckerHandler(
  createFindingGenerator(),
  NEW_COLLATERAL_FACTOR_SIGNATURE,
  COMPOUND_COMPTROLLER_ADDRESS,
);

export default {
  handleTransaction,
}