import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideEventCheckerHandler, FindingGenerator } from "forta-agent-tools";

export const EVENT_SIGNATURE: string = "UpdateGovernance(address)";

export const createFindingGenerator = (yearnVaultAddress: string): FindingGenerator => {
  return () => Finding.fromObject({
    name: "Yearn Finance Updated Governance",
    description: "Detects Updated Governance event on the watched Yearn Vault",
    alertId: "NETHFORTA-23-5",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      YearnVault: yearnVaultAddress,
    },
  });
};

export default function provideUpdatedGovernanceAgent(yearnVaultAddress: string): HandleTransaction {
  return provideEventCheckerHandler(createFindingGenerator(yearnVaultAddress), EVENT_SIGNATURE, yearnVaultAddress);
}
