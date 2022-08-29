import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { Network } from "forta-agent";

export const FILLED_RELAY_EVENT =
  "event FilledRelay(uint256 amount, uint256 totalFilledAmount, uint256 fillAmount, uint256 repaymentChainId, uint256 originChainId, uint256 destinationChainId, uint64 relayerFeePct, uint64 appliedRelayerFeePct, uint64 realizedLpFeePct, uint32 depositId, address destinationToken, address indexed relayer, address indexed depositor, address recipient, bool isSlowRelay)";
export const HUBPOOL_ADDRESS = "0xc186fa914353c44b2e33ebe05f21846f1048beda";
export const GOERLI_POC_HUBPOOL_ADDRESS =
  "0x9d77f6BEEc5E5257B53Cc9b5f9f9952dFfFac6b0";

export function getFindingInstance(
  amountStr: string,
  totalFilledAmountStr: string,
  fillAmountStr: string,
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
      totalFilledAmount: totalFilledAmountStr,
      fillAmount: fillAmountStr,
      originChainId: originChainIdStr,
      destinationChainId: destinationChainIdStr,
      depositor: depositorStr,
      recipient: recipientStr,
      isSlowRelay: isSlowRelayStr,
    },
  });
}

export const MONITORED_ADDRESSES: string[] = [
  "0x2a23A229C406Aa5EB8CB434889719Acbb453E8E7",
  "0x496B53B037BC66Db6e7D34d101FA045e7Bf7D388",
];

export const GOERLI_POC_MONITORED_ADDRESSES: string[] = [
  "0x1Abf3a6C41035C1d2A3c74ec22405B54450f5e13",
  "0x496B53B037BC66Db6e7D34d101FA045e7Bf7D388",
];
