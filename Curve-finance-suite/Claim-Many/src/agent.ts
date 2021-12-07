import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import {
  provideFunctionCallsDetectorHandler,
  FindingGenerator,
} from 'forta-agent-tools';
import { utils } from 'ethers';

// Fee Distribution interface
export const FD_IFACE: utils.Interface = new utils.Interface([
  'function claim_many(address[20] receivers) external returns (bool success)',
]);
const FEE_DISTRIBUTION_ADDRESS: string = '0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc';

const createFindingGenerator = (alertId: string): FindingGenerator => 
  (metadata: { [key: string]: any } | undefined): Finding => 
    Finding.fromObject({
      name: 'CurveDAO Fee Distribution contract called',
      description: 'Function claim_many executed',
      alertId: alertId,
      severity: FindingSeverity.Low,
      type: FindingType.Info,
      protocol: "Curve Finance",
      metadata:{
        from: metadata?.from,
        receivers: JSON.stringify(
          metadata?.arguments[0].map(
            (addr: string) => addr.toLowerCase(),
          ),
        ),
      },
    });

export const provideHandleTransaction = (
  alertID: string,
  address: string
): HandleTransaction => provideFunctionCallsDetectorHandler(
  createFindingGenerator(alertID),
  FD_IFACE.getFunction('claim_many').format('sighash'),
  { 
    to: address, 
    filterOnOutput: (output: string) => 
      FD_IFACE.decodeFunctionResult('claim_many', output).success,
  },
);

export default {
  handleTransaction: provideHandleTransaction(
    "CURVE-1",
    FEE_DISTRIBUTION_ADDRESS,
  )
};
