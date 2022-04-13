import { Finding, HandleBlock, BlockEvent, FindingSeverity, FindingType } from "forta-agent";
import { AddressVerifier, HatFinding, approvalsCall, PropertyFetcher, propertyFetcher } from "./utils";
import BigNumber from "bignumber.js";
import HatManager from "./hat.manager";

export const MKR_THRESHOLD: BigNumber = new BigNumber(40000);
const MKR_DECIMALS: number = 18;

const desc: {
  [key in HatFinding]: string;
} = {
  [HatFinding.UnknownHat]: "Hat is an unknown address",
  [HatFinding.HatModified]: "Hat address modified",
  [HatFinding.FewApprovals]: "Hat MKR is below the threshold",
};

export const createFinding = (alertId: string, finding: HatFinding, metadata: { [key: string]: string } = {}) =>
  Finding.fromObject({
    name: "MakerDAO's Chief contract Hat Alert",
    description: desc[finding],
    alertId: alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    protocol: "Maker",
    metadata: metadata,
  });

export const provideHatChecker = (
  web3Call: any,
  alertId: string,
  contractAddress: string,
  isKnown: AddressVerifier,
  threshold: BigNumber = MKR_THRESHOLD
): HandleBlock => {
  const realThreshold: BigNumber = threshold.multipliedBy(10 ** MKR_DECIMALS);
  const getApprovals: PropertyFetcher = propertyFetcher(web3Call, contractAddress, approvalsCall, "uint256");
  const hatManager: HatManager = new HatManager(web3Call, contractAddress);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const block: number = blockEvent.blockNumber;
    // Get Hat Information
    const previousHat = await hatManager.getAddress(block - 1);
    const hat: string = await hatManager.getAddress(block);

    // Check if hat address is a known address
    if (!isKnown(hat)) {
      findings.push(createFinding(alertId, HatFinding.UnknownHat, { hat: hat }));
    } else {
      // Compare with previous hat address
      if (hat !== previousHat) {
        findings.push(
          createFinding(alertId, HatFinding.HatModified, {
            hat: hat,
            previousHat: previousHat,
          })
        );
      }

      // Retrieve MKR for hat
      const MKR: BigNumber = new BigNumber(await getApprovals(block, hat));

      // Send alarm if MKR is below threshold
      if (realThreshold.isGreaterThan(MKR)) {
        findings.push(
          createFinding(alertId, HatFinding.FewApprovals, {
            hat: hat,
            MKR: MKR.toString(),
            threshold: realThreshold.toString(),
          })
        );
      }
    }

    return findings;
  };
};

export default provideHatChecker;
