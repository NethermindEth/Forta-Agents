import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideEventCheckerHandler, FindingGenerator } from "forta-agent-tools";

export const EVENT_SIGNATURE: string = "StrategyMigrated(address,address)";

export const createFindingGenerator = (yearnVaultAddress: string): FindingGenerator => {
  return () => Finding.fromObject({
    name: "Yearn Finance Strategy Migrated",
    description: "Detects Strategy Migrated event on the watched Yearn Vault",
    alertId: "NETHFORTA-23-3",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      YearnVault: yearnVaultAddress,
    },
  });
};

export default function provideEmergencyShutdownAgent(yearnVaultAddress: string): HandleTransaction {
  return provideEventCheckerHandler(createFindingGenerator(yearnVaultAddress), EVENT_SIGNATURE, yearnVaultAddress);
}
