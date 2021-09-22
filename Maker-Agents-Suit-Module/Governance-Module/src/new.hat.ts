import { 
  Finding, 
  HandleBlock, 
  BlockEvent, 
  FindingSeverity, 
  FindingType, 
} from 'forta-agent';
import {
  Set,
  HAT_JSON_INTERFACE,
  APPROVALS_JSON_INTERFACE,
  HatFinding,
} from './utils';
import Web3 from 'web3';
import BigNumber from 'bignumber.js'

const _web3: Web3 = new Web3();

const MKR_THRESHOLD: BigNumber = new BigNumber(40000);

const desc: {
  [key in HatFinding]: string;
} = {
  [HatFinding.UnknownHat]:   "Hat is an unknown address",
  [HatFinding.HatModified]:  "Hat address modified",
  [HatFinding.FewApprovals]: "Hat MKR is below the threshold",
}

export const createFinding = (
  alertId: string,
  finding: HatFinding, 
  metadata: { [key: string]: string } = {},
) => 
  Finding.fromObject({
    name: "Chief contract Hat Alert",
    description: desc[finding],
    alertId: alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    metadata: metadata,
  });

export const provideHatChecker = (
  web3Call: any,
  alertId: string, 
  contractAddress: string,
  knownAddresses: Set,
  threshold: BigNumber = MKR_THRESHOLD,
): HandleBlock => {

  const getHat = async (block: number) => {
    const encodedHat = await web3Call({
      to: contractAddress,
      data: _web3.eth.abi.encodeFunctionCall(HAT_JSON_INTERFACE, [])
    }, block);
    const hat: string = _web3.eth.abi.decodeParameters(['address'], encodedHat)[0];
    return hat.toLowerCase();
  }

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    // Get the current Hat
    const hat: string = await getHat(blockEvent.blockNumber);

    // Check if hat address is a known address 
    if(!knownAddresses[hat]){
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
        data: _web3.eth.abi.encodeFunctionCall(APPROVALS_JSON_INTERFACE, [hat])
      }, blockEvent.blockNumber);
      const MKR: BigNumber = _web3.eth.abi.decodeParameters(['uint256'], encodedMKR)[0];

      // Send alarm if MKR is below threshold
      if(MKR < threshold){
        findings.push(
          createFinding(
            alertId,
            HatFinding.FewApprovals,
            { hat: hat, MKR: MKR.toString(), threshold: threshold.toString() },
          ),
        );
      }
    }

    return findings;
  };
};
