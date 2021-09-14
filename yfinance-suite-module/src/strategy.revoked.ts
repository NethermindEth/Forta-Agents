import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideEventCheckerHandler, FindingGenerator } from "general-agents-module";

export const EVENT_SIGNATURE: string = "StrategyRevoked(address)";

const createFindingGenerator = (alertId: string, yearnVaultAddress: string): FindingGenerator => {
  return () => Finding.fromObject({
    name: "Yearn Finance Strategy Revoked",
    description: "Detects Strategy Revoked event on the watched Yearn Vault",
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
