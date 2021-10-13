import { HandleTransaction, Finding, TransactionEvent } from "forta-agent";
import provideEmergencyShutdownAgent from "./emergency.shutdown";
import provideStrategyMigratedAgent from "./strategy.migrated";
import provideStrategyRevokedAgent from "./strategy.revoked";
import provideUpdatedGovernanceAgent from "./updated.governance";
import provideUpdatedGuardianAgent from "./updated.guardian";

const vaultAddresses: string[] = [
"0xB8C3B7A2A618C552C23B1E4701109a9E756Bab67",
"0xa258C4606Ca8206D8aA700cE2143D7db854D168c",
"0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9",
"0xdA816459F1AB5631232FE5e97a05BBBb94970c95",
"0xA696a63cc78DfFa1a63E9E50587C197387FF6C7E",
"0xFBEB78a723b8087fD2ea7Ef1afEc93d35E8Bed42",
"0xc5bDdf9843308380375a611c18B50Fb9341f502A",
"0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a",
"0xE14d13d8B3b85aF791b2AADD661cDBd5E6097Db1",
"0xF29AE508698bDeF169B89834F76704C3B205aedf",
"0x873fB544277FD7b977B196a826459a69E27eA4ea",
"0x671a912C10bba0CFA74Cfc2d6Fba9BA1ed9530B2",
];

const provideHandlerForVault = (vaultAddress: string): HandleTransaction => {
  const emergencyShutdownHandler: HandleTransaction = provideEmergencyShutdownAgent(vaultAddress);
  const strategyMigratedHandler: HandleTransaction = provideStrategyMigratedAgent(vaultAddress);
  const strategyRevokedHandler: HandleTransaction = provideStrategyRevokedAgent(vaultAddress);
  const updatedGovernanceHandler: HandleTransaction = provideUpdatedGovernanceAgent(vaultAddress);
  const updatedGuardianHandler: HandleTransaction = provideUpdatedGuardianAgent(vaultAddress);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    findings = findings.concat(await emergencyShutdownHandler(txEvent));
    findings = findings.concat(await strategyMigratedHandler(txEvent));
    findings = findings.concat(await strategyRevokedHandler(txEvent));
    findings = findings.concat(await updatedGovernanceHandler(txEvent));
    findings = findings.concat(await updatedGuardianHandler(txEvent));

    return findings;
  };
};

export const provideHandlerTransaction = (vaultAddresses: string[]): HandleTransaction => {
  const vaultHandlers: HandleTransaction[] = vaultAddresses.map((vaultAddr: string) => provideHandlerForVault(vaultAddr))
    
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    for (let handler of vaultHandlers) {
      findings = findings.concat(await handler(txEvent));
    }

    return findings;
  };
}

export default {
  handleTransaction: provideHandlerTransaction(vaultAddresses),
}
