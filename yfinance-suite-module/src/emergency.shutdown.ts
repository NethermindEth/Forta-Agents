import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideEventCheckerHandler, FindingGenerator } from "general-agents-module";

export const EVENT_SIGNATURE: string = "EmergencyShutdown(bool)";

const createFindingGenerator = (alertId: string, yearnVaultAddress: string): FindingGenerator => {
  return () => Finding.fromObject({
    name: "Yearn Finance Emergency Shutdown",
    description: "Detects Emergency Shutdown event on the watched Yearn Vault",
    alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      YearnVault: yearnVaultAddress,
    },
  });
};

export default function provideEmergencyShutdownAgent(yearnVaultAddress: string, alertId: string): HandleTransaction {
  return provideEventCheckerHandler(createFindingGenerator(alertId, yearnVaultAddress), EVENT_SIGNATURE, yearnVaultAddress);
}
