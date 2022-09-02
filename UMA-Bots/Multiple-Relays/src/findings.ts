import { Finding, FindingSeverity, FindingType } from "forta-agent";

//alert parameters configuration
export const FINDING_PARAMETERS = {
  timeWindow: 10 * 60, //in seconds
  threshold: 3, //number of relays in the specified time window to trigger a finding
};

//function to generate findings
export function createFinding(
  _metadata: {
    amount: string;
    originChainId: string;
    destinationChainId: string;
    tokenName: string;
    depositor: string;
    recipient: string;
    relayer: string;
  },
  _delta: number //delta time in minutes
) {
  return Finding.fromObject({
    name: "SpokePool Multiple Filled Relay Events Emitted",
    description: `${FINDING_PARAMETERS.threshold} relays in ${_delta} minutes by: ${_metadata.relayer}`,
    alertId: "UMA-8",
    protocol: "UMA",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    metadata: _metadata,
  });
}
