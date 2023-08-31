import { Finding, FindingType, FindingSeverity, Label, EntityType } from "forta-agent";
import { BigNumber } from "ethers";

export function createFraudNftOrderFinding(
  victimAddress: string,
  scammerAddress: string,
  alertId: string,
  totalUsdLost: number,
  name: string,
  contractAddress: string,
  tokenId: string,
  totalUsdLostInErc721s: number,
  exploitTransactionHash: string,
  usdLostOnThisToken: number
): Finding {
  return Finding.fromObject({
    name: `New victim identified: ${victimAddress}`,
    description: `${victimAddress} has fallen victim to scammer ${scammerAddress}`,
    alertId: "VICTIM-LOSS-INFORMATION",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    // uniqueKey,
    // source: { chains: [{ chainId }] },
    addresses: [victimAddress, scammerAddress],
    // protocol: ,
    metadata: {
      scam_detector_alert_id: alertId,
      victim_address: victimAddress,
      usd_lost: totalUsdLost.toString(),
      erc_721_usd_lost: totalUsdLostInErc721s.toString(),
      erc_721_lost: `name: ${name} | contract: ${contractAddress} | token id: ${tokenId} | value USD: ${usdLostOnThisToken}`,
    },
    labels: [
      Label.fromObject({
        entity: victimAddress,
        entityType: EntityType.Address,
        label: "Victim Address",
        confidence: 0.70,
        remove: false,
      }),
      Label.fromObject({
        entity: tokenId + "," + contractAddress,
        entityType: EntityType.Address,
        label: "NFT",
        confidence: 0.70,
        remove: false,
      }),
      Label.fromObject({
        entity: exploitTransactionHash,
        entityType: EntityType.Transaction,
        label: "Exploit transaction",
        confidence: 0.70,
        remove: false,
      }),
    ],
  });
}
