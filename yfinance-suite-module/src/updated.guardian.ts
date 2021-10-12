import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideEventCheckerHandler, FindingGenerator } from "forta-agent-tools";

const EVENT_SIGNATURE: string = "UpdateGuardian(address)";

const createFindingGenerator = (alertId: string, yearnVaultAddress: string): FindingGenerator => {
  return () => Finding.fromObject({
    name: "Yearn Finance Updated Guardian",
    description: "Detects Updated Guardian event on the wathced Yearn Vault",
    alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      YearnVault: yearnVaultAddress,
    },
  });
};

export default function provideUpdatedGuardianAgent(yearnVaultAddress: string, alertId: string): HandleTransaction {
  return provideEventCheckerHandler(createFindingGenerator(alertId, yearnVaultAddress), EVENT_SIGNATURE, yearnVaultAddress);
}
