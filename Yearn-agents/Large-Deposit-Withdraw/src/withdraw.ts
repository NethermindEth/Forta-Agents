import { 
  Finding, 
  FindingSeverity, 
  FindingType, 
  Log,
} from 'forta-agent';
import BigNumber from 'bignumber.js';
import { isZeroAddress } from "ethereumjs-util";
import { decodeParameter, provideEventCheckerHandler } from 'forta-agent-tools';


export const TRANSFER_SIGNATURE: string = "Transfer(address,address,uint256)";


const createFinding = (metadata: any): Finding => {
  const from: string = decodeParameter('address', metadata?.topics[1]);
  const value: BigNumber = new BigNumber(decodeParameter('uint256', metadata?.data));
  
  return Finding.fromObject({
    name: "Yearn Vaults withdrawal",
    description: "Large withdrawal detected",
    alertId: "Yearn-6-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      Vault: metadata?.address,
      From: from,
      Amount: value.toString(),
    }
  });
};


const provideLargeWithdrawDetector = (vaultAddr: string, largeAmout: BigNumber) =>
  provideEventCheckerHandler(
    createFinding,
    TRANSFER_SIGNATURE,
    vaultAddr,
    (log: Log): boolean => {
      const to: string = decodeParameter('address', log.topics[2]);
      const value: BigNumber = new BigNumber(decodeParameter('uint256', log.data));

      return isZeroAddress(to) && largeAmout.lte(value);
    },
  );


export default {
  provideLargeWithdrawDetector,
  createFinding,
  TRANSFER_SIGNATURE,
};
