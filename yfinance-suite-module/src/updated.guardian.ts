import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideEventCheckerHandler, FindingGenerator } from "forta-agent-tools";

const EVENT_SIGNATURE: string = "UpdateGuardian(address)";

export const createFindingGenerator = (yearnVaultAddress: string): FindingGenerator => {
  return () => Finding.fromObject({
    name: "Yearn Finance Updated Guardian",
    description: "Detects Updated Guardian event on the wathced Yearn Vault",
    alertId: "NETHFORTA-23-6",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      YearnVault: yearnVaultAddress,
    },
  });
};

export default function provideUpdatedGuardianAgent(yearnVaultAddress: string): HandleTransaction {
  return provideEventCheckerHandler(createFindingGenerator(yearnVaultAddress), EVENT_SIGNATURE, yearnVaultAddress);
}
