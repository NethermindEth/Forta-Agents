import { Finding, HandleBlock, BlockEvent, FindingSeverity, FindingType } from "forta-agent";
import { AddressVerifier, HatFinding } from "./utils";
import { BigNumber } from "ethers";
import HatFetcher from "./hat.fetcher";

const desc: {
  [key in HatFinding]: [string, FindingSeverity];
} = {
  [HatFinding.UnknownHat]: ["Hat is an unknown address", FindingSeverity.High],
  [HatFinding.HatModified]: ["Hat address modified", FindingSeverity.Low],
  [HatFinding.FewApprovals]: ["Hat MKR is below the threshold", FindingSeverity.High],
};

export const createFinding = (alertId: string, finding: HatFinding, metadata: { [key: string]: string } = {}) => {
  const [_description, _severity] = desc[finding];

  return Finding.fromObject({
    name: "MakerDAO's Chief contract Hat Alert",
    description: _description,
    alertId: alertId,
    type: FindingType.Info,
    severity: _severity,
    protocol: "Maker",
    metadata: metadata,
  });
}

export const provideHatChecker = (
  alertId: string,
  isKnown: AddressVerifier,
  threshold: BigNumber,
  fetcher: HatFetcher
): HandleBlock => {
  const realThreshold: BigNumber = threshold.mul("1000000000000000000");

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const block: number = blockEvent.blockNumber;
    // Get Hat Information
    const previousHat = await fetcher.getHat(block - 1);
    const hat: string = await fetcher.getHat(block);

    // Check if hat address is a known address
    if (!isKnown(hat)) {
      findings.push(createFinding(alertId, HatFinding.UnknownHat, { hat: hat.toLowerCase() }));
    } else {
      // Compare with previous hat address
      if (hat !== previousHat) {
        findings.push(
          createFinding(alertId, HatFinding.HatModified, {
            hat: hat.toLowerCase(),
            previousHat: previousHat.toLowerCase(),
          })
        );
      }

      // Retrieve MKR for hat
      const MKR: BigNumber = await fetcher.getHatApprovals(block);

      // Send alarm if MKR is below threshold
      if (realThreshold.gt(MKR)) {
        findings.push(
          createFinding(alertId, HatFinding.FewApprovals, {
            hat: hat.toLowerCase(),
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
