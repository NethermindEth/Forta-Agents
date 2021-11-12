import { 
  Finding, 
  FindingSeverity, 
  FindingType, 
  HandleTransaction, 
} from 'forta-agent';
import BigNumber from 'bignumber.js';
import { decodeParameter, provideFunctionCallsDetectorHandler } from 'forta-agent-tools';


export const DEPOSIT_SIGNATURE: string = "deposit(uint256,address)";


const createFinding = (metadata: any): Finding => {
  const output: BigNumber = new BigNumber(decodeParameter('uint256', metadata?.output));
  
  return Finding.fromObject({
    name: "Yearn Vaults deposit",
    description: "Large deposit detected",
    alertId: "Yearn-6-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      Vault: metadata?.to,
      From: metadata?.from,
      To: metadata?.arguments[1].toLowerCase(),
      Amount: output.toString(),
    },
  });
};


const provideOutputFilter = (value: BigNumber) =>
  (output: string) => {
    const shares: BigNumber = new BigNumber(decodeParameter("uint256", output));
    return shares.gte(value);
  };


const provideLargeDepositDetector = (vaultAddr: string, largeAmout: BigNumber): HandleTransaction =>
  provideFunctionCallsDetectorHandler(
    createFinding,
    DEPOSIT_SIGNATURE,
    { to: vaultAddr, filterOnOutput: provideOutputFilter(largeAmout) },
  );


export default {
  provideLargeDepositDetector,
  createFinding,
  DEPOSIT_SIGNATURE,
};
