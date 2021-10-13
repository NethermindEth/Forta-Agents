import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { provideHandlerTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { createFindingGenerator as strategyMigratedFinding } from "./strategy.migrated";
import { createFindingGenerator as strategyRevokedFinding } from "./strategy.revoked";
import { createFindingGenerator as updateGovernanceFinding } from "./updated.governance";
import { createFindingGenerator as updateGuardianFinding } from "./updated.guardian";

const testAddresses: string[] = [createAddress("0x1"), createAddress("0x2")];

describe("Yearn Vault Agents Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings", async () => {
    handleTransaction = provideHandlerTransaction(testAddresses);

    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings when multiple conditions are met for the same value", async () => {
    handleTransaction = provideHandlerTransaction(testAddresses);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog("StrategyMigrated(address,address)", testAddresses[0])
      .addEventLog("UpdateGovernance(address)", testAddresses[0]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      strategyMigratedFinding(testAddresses[0])(),
      updateGovernanceFinding(testAddresses[0])(),
    ]);
  });

  it("should return multiple finding related to multiple vaults", async () => {
    handleTransaction = provideHandlerTransaction(testAddresses);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog("StrategyRevoked(address)", testAddresses[0])
      .addEventLog("UpdateGuardian(address)", testAddresses[1]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      strategyRevokedFinding(testAddresses[0])(),
      updateGuardianFinding(testAddresses[1])(),
    ]);
  });
});
