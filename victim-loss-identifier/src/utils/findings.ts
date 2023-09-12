import { Finding, FindingType, FindingSeverity, Label, EntityType, ethers } from "forta-agent";
import { FpTransaction } from "src/types";

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
  assessmentPeriodDays: number,
  usdLostToThisScammer: number
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
    description: `${victimAddress} has fallen victim to scammer ${scammerAddress} in transaction ${exploitTransactionHash}`,
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
      usd_lost_to_scammer: usdLostToThisScammer.toString(),
      erc_721_usd_lost: totalUsdLostInErc721s.toString(),
      erc_721_lost: `name: ${name} | contract: ${contractAddress} | token id: ${tokenId} | value USD: ${usdLostOnThisToken}`,
    },
    labels: [
      Label.fromObject({
        entity: victimAddress,
        entityType: EntityType.Address,
        label: "Victim",
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
        label: "Exploit",
        confidence: 0.7,
        remove: false,
      }),
    ],
  });
}

export function createFpFinding(fpScammer: string, fpVictims: string[], fpData: FpTransaction[]): Finding {
  const uniqueFpNfts = new Set<string>();
  const uniqueFpTxHashes = new Set<string>();

  fpData.forEach((fp) => {
    fp.nfts.forEach((nft) => uniqueFpNfts.add(nft));
    uniqueFpTxHashes.add(fp.txHash);
  });

  const labels: Label[] = [
    Label.fromObject({
      entity: fpScammer,
      entityType: EntityType.Address,
      label: "Benign",
      confidence: 0.7,
      remove: false,
    }),
    ...fpVictims.map((fpVictim) =>
      Label.fromObject({
        entity: fpVictim,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: 0.7,
        remove: true,
      })
    ),
    ...Array.from(uniqueFpNfts).map((nft) =>
      Label.fromObject({
        entity: nft,
        entityType: EntityType.Address,
        label: "NFT",
        confidence: 0.7,
        remove: true,
      })
    ),
    ...Array.from(uniqueFpTxHashes).map((txHash) =>
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Exploit",
        confidence: 0.7,
        remove: true,
      })
    ),
  ];

  return Finding.fromObject({
    name: "Incorrectly identified address detected - False Positive Alert",
    description: `${fpScammer} is likely not associated with a scam. Emitting FP labels.`,
    alertId: "VICTIM-LOSS-INFORMATION-FALSE-POSITIVE",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {},
    labels,
  });
}
