import { Finding, FindingType, FindingSeverity, Label, EntityType, ethers } from "forta-agent";
import { BigNumber } from "ethers";
import { MockExploitInfo } from "./mock.types";

export function createTestingFraudNftOrderFinding(
  mockExploitInstance: MockExploitInfo,
  scammerAddress: string,
  alertId: string,
  totalUsdLost: BigNumber,
  totalUsdLostInErc721s: BigNumber,
  usdLostOnThisToken: BigNumber,
  assessmentPeriodDays: number,
  usdLostToThisScammer: BigNumber
): Finding {
  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      mockExploitInstance.stolenTokenAddress + mockExploitInstance.stolenTokenId + mockExploitInstance.exploitTxnHash
    )
  );

  const now: Date = new Date();
  const endTimestamp: number = Math.floor(now.getTime() / 1000); // Convert to seconds

  const startTimestampDate: Date = new Date(now);
  startTimestampDate.setDate(now.getDate() - assessmentPeriodDays);
  const startTimestamp: number = Math.floor(startTimestampDate.getTime() / 1000); // Convert to seconds

  return Finding.fromObject({
    name: `Victim identified: ${mockExploitInstance.victimAddress}`,
    description: `${mockExploitInstance.victimAddress} has fallen victim to scammer ${scammerAddress} in transaction ${mockExploitInstance.exploitTxnHash}`,
    alertId: "VICTIM-LOSS-INFORMATION",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    uniqueKey,
    addresses: [mockExploitInstance.victimAddress, scammerAddress],
    metadata: {
      start_timestamp: startTimestamp.toString(),
      end_timestamp: endTimestamp.toString(),
      scam_detector_alert_id: alertId,
      victim_address: mockExploitInstance.victimAddress,
      tx_hash: mockExploitInstance.exploitTxnHash,
      usd_lost: totalUsdLost.toString(),
      usd_lost_to_scammer: usdLostToThisScammer.toString(),
      erc_721_usd_lost: totalUsdLostInErc721s.toString(),
      erc_721_lost: `name: ${mockExploitInstance.stolenTokenName} | contract: ${mockExploitInstance.stolenTokenAddress} | token id: ${mockExploitInstance.stolenTokenId} | value USD: ${usdLostOnThisToken}`,
    },
    labels: [
      Label.fromObject({
        entity: mockExploitInstance.victimAddress,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: 0.7,
        remove: false,
      }),
      Label.fromObject({
        entity: mockExploitInstance.stolenTokenId + "," + mockExploitInstance.stolenTokenAddress,
        entityType: EntityType.Address,
        label: "NFT",
        confidence: 0.7,
        remove: false,
      }),
      Label.fromObject({
        entity: mockExploitInstance.exploitTxnHash,
        entityType: EntityType.Transaction,
        label: "Exploit",
        confidence: 0.7,
        remove: false,
      }),
    ],
  });
}

export function createTestingIcePhishingFinding(
  mockExploitInstance: MockExploitInfo,
  scammerAddress: string,
  alertId: string,
  isTokenErc20: boolean,
  totalUsdLost: BigNumber,
  totalUsdLostInThisErcType: BigNumber,
  usdLostOnThisToken: BigNumber,
  assessmentPeriodDays: number,
  usdLostToThisScammer: BigNumber
): Finding {
  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      mockExploitInstance.stolenTokenAddress + mockExploitInstance.stolenTokenId + mockExploitInstance.exploitTxnHash
    )
  );

  const now: Date = new Date();
  const endTimestamp: number = Math.floor(now.getTime() / 1000); // Convert to seconds

  const startTimestampDate: Date = new Date(now);
  startTimestampDate.setDate(now.getDate() - assessmentPeriodDays);
  const startTimestamp: number = Math.floor(startTimestampDate.getTime() / 1000); // Convert to seconds

  let metadata: {
    start_timestamp: string;
    end_timestamp: string;
    scam_detector_alert_id: string;
    victim_address: string;
    tx_hash: string;
    usd_lost: string;
    usd_lost_to_scammer: string;
    erc_20_usd_lost?: string; // Optional property
    erc_20_lost?: string; // Optional property
    erc_721_usd_lost?: string; // Optional property
    erc_721_lost?: string; // Optional property
  } = {
    start_timestamp: startTimestamp.toString(),
    end_timestamp: endTimestamp.toString(),
    scam_detector_alert_id: alertId,
    victim_address: mockExploitInstance.victimAddress,
    tx_hash: mockExploitInstance.exploitTxnHash,
    usd_lost: totalUsdLost.toString(),
    usd_lost_to_scammer: usdLostToThisScammer.toString(),
  };

  let labels = [
    Label.fromObject({
      entity: mockExploitInstance.victimAddress,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.7,
      remove: false,
    }),
    Label.fromObject({
      entity: mockExploitInstance.exploitTxnHash,
      entityType: EntityType.Transaction,
      label: "Exploit",
      confidence: 0.7,
      remove: false,
    }),
  ];

  if (isTokenErc20) {
    metadata.erc_20_usd_lost = totalUsdLostInThisErcType.toString();
    metadata.erc_20_lost = `name: ${mockExploitInstance.stolenTokenName} | contract: ${mockExploitInstance.stolenTokenAddress} | value: ${mockExploitInstance.stolenTokenAmount} | value USD: ${usdLostOnThisToken}`;
  } else {
    metadata.erc_721_usd_lost = totalUsdLostInThisErcType.toString();
    metadata.erc_721_lost = `name: ${mockExploitInstance.stolenTokenName} | contract: ${mockExploitInstance.stolenTokenAddress} | token id: ${mockExploitInstance.stolenTokenId} | value USD: ${usdLostOnThisToken}`;
    labels.push(
      Label.fromObject({
        entity: mockExploitInstance.stolenTokenId + "," + mockExploitInstance.stolenTokenAddress,
        entityType: EntityType.Address,
        label: "NFT",
        confidence: 0.7,
        remove: false,
      })
    );
  }

  return Finding.fromObject({
    name: `Victim identified: ${mockExploitInstance.victimAddress}`,
    description: `${mockExploitInstance.victimAddress} has fallen victim to scammer ${scammerAddress} in transaction ${mockExploitInstance.exploitTxnHash}`,
    alertId: "VICTIM-LOSS-INFORMATION",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    uniqueKey,
    addresses: [mockExploitInstance.victimAddress, scammerAddress],
    metadata,
    labels,
  });
}
