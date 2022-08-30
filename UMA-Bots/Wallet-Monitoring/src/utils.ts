import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const FILLED_RELAY_EVENT =
  "event FilledRelay(uint256 amount, uint256 totalFilledAmount, uint256 fillAmount, uint256 repaymentChainId, uint256 originChainId, uint256 destinationChainId, uint64 relayerFeePct, uint64 appliedRelayerFeePct, uint64 realizedLpFeePct, uint32 depositId, address destinationToken, address indexed relayer, address indexed depositor, address recipient, bool isSlowRelay)";
export const GOERLI_POC_SPOKEPOOL_ADDRESS =
  "0x8Ec948A7823745FE5e2591df63654C9d7e4809c4";
export const MAINNET_SPOKEPOOL = "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381";
export const OPTIMISM_SPOKEPOOL = "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9";
export const POLYGON_SPOKEPOOL = "0x69B5c72837769eF1e7C164Abc6515DcFf217F920";
export const ARBITRUM_SPOKEPOOL = "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C";

export const MAINNET_MONITORED_ADDRESSES: string[] = [
  "0x0C0858290b6b268a93fB557af06390A3460c5dB6",
  "0x1285C2f3ead18A580D45F433852238317A10fAF7",
  "0xc1ccCD378C8400d08b2c5EC091e93135eA58a5B8"
];

export const GOERLI_POC_MONITORED_ADDRESSES: string[] = [
  "0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13",
  "0x496B53B037BC66Db6e7D34d101FA045e7Bf7D388",
]; // PoC addresses

export const POLYGON_MONITORED_ADDRESSES: string[] = [];
export const OPTIMISM_MONITORED_ADDRESSES: string[] = [];
export const ARBITRUM_MONITORED_ADDRESSES: string[] = [];

export function getFindingInstance(
  amountStr: string,
  originChainIdStr: string,
  destinationChainIdStr: string,
  depositorStr: string,
  recipientStr: string,
  isSlowRelayStr: string
) {
  return Finding.fromObject({
    name: "Monitored Wallet Used",
    description:
      "A monitored wallet was used to transfer money across the bridge",
    alertId: "UMA-10",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      amount: amountStr,
      originChainId: originChainIdStr,
      destinationChainId: destinationChainIdStr,
      depositor: depositorStr,
      recipient: recipientStr,
      isSlowRelay: isSlowRelayStr,
    },
  });
}
