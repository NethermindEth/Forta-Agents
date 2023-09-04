import { Finding, FindingType, FindingSeverity, Label, EntityType, ethers } from "forta-agent";
import { BigNumber } from "ethers";
import { MockExploitInfo } from "./mock.types";

export function createTestingFraudNftOrderFinding(
  mockExploitInstance: MockExploitInfo,
  scammerAddress: string,
  alertId: string,
  totalUsdLost: BigNumber,
  totalUsdLostInErc721s: BigNumber,
  usdLostOnThisToken: BigNumber
): Finding {
  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      mockExploitInstance.stolenTokenAddress + mockExploitInstance.stolenTokenId + mockExploitInstance.exploitTxnHash
    )
  );
  return Finding.fromObject({
    name: `Victim identified: ${mockExploitInstance.victimAddress}`,
    description: `${mockExploitInstance.victimAddress} has fallen victim to scammer ${scammerAddress}`,
    alertId: "VICTIM-LOSS-INFORMATION",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    uniqueKey,
    addresses: [mockExploitInstance.victimAddress, scammerAddress],
    metadata: {
      scam_detector_alert_id: alertId,
      victim_address: mockExploitInstance.victimAddress,
      tx_hash: mockExploitInstance.exploitTxnHash,
      usd_lost: totalUsdLost.toString(),
      erc_721_usd_lost: totalUsdLostInErc721s.toString(),
      erc_721_lost: `name: ${mockExploitInstance.stolenTokenName} | contract: ${mockExploitInstance.stolenTokenAddress} | token id: ${mockExploitInstance.stolenTokenId} | value USD: ${usdLostOnThisToken}`,
    },
    labels: [
      Label.fromObject({
        entity: mockExploitInstance.victimAddress,
        entityType: EntityType.Address,
        label: "Victim Address",
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
        label: "Exploit transaction",
        confidence: 0.7,
        remove: false,
      }),
    ],
  });
}
