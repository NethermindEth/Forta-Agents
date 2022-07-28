import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { handleTransaction } from "./agent";
import NetworkManager from "./network";
import utils from "./utils";
import abi from "./abi"; 

const TEST_APEFACTORY_CONTRACT = createAddress("0x234a");
const OTHER_FUNCTION_IFACE: Interface = new Interface([
  "function otherFunction(address otherAddress)",
]);

const setMigrator = (address: string): Finding =>
  Finding.fromObject({
    name: "MasterChef Settings",
      description: `setMigrator function called in MasterChef contract.`,
      alertId: "CAKE-5-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {
        _migrator: address.toLowerCase(),
  },
});

describe("Apeswap role changes bot test suite", () => {
  const mockNetworkManager: NetworkManager = {
    factory: TEST_APEFACTORY_CONTRACT,
    setNetwork: jest.fn(),
  };
  const handleTx: HandleTransaction = handleTransaction(
    mockNetworkManager as any
  );

  it("should ignore empty transactions", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });


});