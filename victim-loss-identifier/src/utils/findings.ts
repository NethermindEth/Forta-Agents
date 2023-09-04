import { Finding, FindingType, FindingSeverity, Label, EntityType, ethers } from "forta-agent";

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
  usdLostOnThisToken: number,
  assessmentPeriodDays: number
): Finding {
  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(contractAddress + tokenId + exploitTransactionHash)
  );

  const now: Date = new Date();
  const endTimestamp: number = Math.floor(now.getTime() / 1000); // Convert to seconds

  const startTimestampDate: Date = new Date(now);
  startTimestampDate.setDate(now.getDate() - assessmentPeriodDays);
  const startTimestamp: number = Math.floor(startTimestampDate.getTime() / 1000); // Convert to seconds

  return Finding.fromObject({
    name: `Victim identified: ${victimAddress}`,
    description: `${victimAddress} has fallen victim to scammer ${scammerAddress}`, // TODO: txn hash
    alertId: "VICTIM-LOSS-INFORMATION",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    uniqueKey,
    addresses: [victimAddress, scammerAddress],
    metadata: {
      start_timestamp: startTimestamp.toString(),
      end_timestamp: endTimestamp.toString(),
      scam_detector_alert_id: alertId,
      victim_address: victimAddress,
      tx_hash: exploitTransactionHash,
      usd_lost: totalUsdLost.toString(),
      erc_721_usd_lost: totalUsdLostInErc721s.toString(),
      erc_721_lost: `name: ${name} | contract: ${contractAddress} | token id: ${tokenId} | value USD: ${usdLostOnThisToken}`,
    },
    labels: [
      Label.fromObject({
        entity: victimAddress,
        entityType: EntityType.Address,
        label: "Victim Address",
        confidence: 0.7,
        remove: false,
      }),
      Label.fromObject({
        entity: tokenId + "," + contractAddress,
        entityType: EntityType.Address,
        label: "NFT",
        confidence: 0.7,
        remove: false,
      }),
      Label.fromObject({
        entity: exploitTransactionHash,
        entityType: EntityType.Transaction,
        label: "Exploit transaction",
        confidence: 0.7,
        remove: false,
      }),
    ],
  });
}
