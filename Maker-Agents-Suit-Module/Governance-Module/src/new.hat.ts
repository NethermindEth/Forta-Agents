import { 
  Finding, 
  HandleBlock, 
  BlockEvent, 
  FindingSeverity, 
  FindingType, 
} from 'forta-agent';
import {
  AddressVerifier,
  HatFinding,
  hatCall,
  decodeSingleParam,
  approvalsCall,
} from './utils';
import BigNumber from 'bignumber.js'

const MKR_THRESHOLD: BigNumber = new BigNumber(40000);
const MKR_DECIMALS: number = 18;

const desc: {
  [key in HatFinding]: string;
} = {
  [HatFinding.UnknownHat]:   "Hat is an unknown address",
  [HatFinding.HatModified]:  "Hat address modified",
  [HatFinding.FewApprovals]: "Hat MKR is below the threshold",
};

export const createFinding = (
  alertId: string,
  finding: HatFinding, 
  metadata: { [key: string]: string } = {},
) => 
  Finding.fromObject({
    name: "MakerDAO's Chief contract Hat Alert",
    description: desc[finding],
    alertId: alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    protocol: "Maker",
    everestId: "0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437",
    metadata: metadata,
  });

export const provideHatChecker = (
  web3Call: any,
  alertId: string, 
  contractAddress: string,
  isKnown: AddressVerifier,
  threshold: BigNumber = MKR_THRESHOLD,
): HandleBlock => {

  const realThreshold: BigNumber = threshold.multipliedBy(10 ** MKR_DECIMALS);

  const getHat = async (block: number) => {
    const encodedHat = await web3Call({
      to: contractAddress,
      data: hatCall(),
    }, block);
    const hat: string = decodeSingleParam('address', encodedHat);
    return hat.toLowerCase();
  }

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    // Get the current Hat
    const hat: string = await getHat(blockEvent.blockNumber);

    // Check if hat address is a known address 
    if(!(await isKnown(hat))){
      findings.push(
        createFinding(
          alertId,
          HatFinding.UnknownHat,
          { hat: hat },
        ),
      );
    }
    else{
      // Compare with previous hat address
      const previousHat = await getHat(blockEvent.blockNumber - 1);
      if(hat !== previousHat){
        findings.push(
          createFinding(
            alertId,
            HatFinding.HatModified,
            { hat: hat, previousHat: previousHat },
          ),
        );
      }

      // Retrieve MKR for hat
      const encodedMKR = await web3Call({
        to: contractAddress,
        data: approvalsCall(hat),
      }, blockEvent.blockNumber);
      const MKR: BigNumber = decodeSingleParam('uint256', encodedMKR);

      // Send alarm if MKR is below threshold
      if(realThreshold.isGreaterThan(MKR)){
        findings.push(
          createFinding(
            alertId,
            HatFinding.FewApprovals,
            { hat: hat, MKR: MKR.toString(), threshold: realThreshold.toString() },
          ),
        );
      }
    }

    return findings;
  };
};

export default provideHatChecker;
