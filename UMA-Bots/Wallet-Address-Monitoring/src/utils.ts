import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const FILLED_RELAY_EVENT =
  "event FilledRelay(uint256 amount, uint256 totalFilledAmount, uint256 fillAmount, uint256 repaymentChainId, uint256 originChainId, uint256 destinationChainId, uint64 relayerFeePct, uint64 appliedRelayerFeePct, uint64 realizedLpFeePct, uint32 depositId, address destinationToken, address indexed relayer, address indexed depositor, address recipient, bool isSlowRelay)";
export const GOERLI_POC_SPOKEPOOL_ADDRESS = "0xB78E8c93Ae8B6DBB3414667aa7def46083C6A87C";
export const MAINNET_SPOKEPOOL = "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381";
export const OPTIMISM_SPOKEPOOL = "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9";
export const POLYGON_SPOKEPOOL = "0x69B5c72837769eF1e7C164Abc6515DcFf217F920";
export const ARBITRUM_SPOKEPOOL = "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C";

export const GOERLI_POC_MONITORED_ADDRESSES: string[] = [
  "0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13",
  "0x496B53B037BC66Db6e7D34d101FA045e7Bf7D388",
]; // PoC addresses

export function getFindingInstance(
  amount: string,
  originChainId: string,
  destinationChainId: string,
  depositor: string,
  recipient: string,
  isSlowRelay: string
) {
  return Finding.fromObject({
    name: "Monitored Wallet address Used",
    description: "A monitored wallet address was used to transfer funds across the bridge",
    alertId: "UMA-10",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      amount,
      originChainId,
      destinationChainId,
      depositor,
      recipient,
      isSlowRelay,
    },
  });
}
