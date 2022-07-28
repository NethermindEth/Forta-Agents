import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { handleTransaction } from "./agent";
import NetworkManager from "./network";
import abi from "./abi";


const MOCK_ABI: string[] = [
  "function mockFunction(address mockAddress)",
];

const testFrom = createAddress("0x0");
const testMasterchef: string = createAddress("0x01");

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

describe("Set Masterchef Settings bot test suite", () => {
  const iface = new Interface(abi.CAKE_ABI);
  const mockInterface = new Interface(MOCK_ABI);

  const mockNetworkManager: NetworkManager = {
    factory: testMasterchef,
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

  // it("should detect setMigrator function calls", async () => {
  //   const tx: TransactionEvent = new TestTransactionEvent().addTraces({
  //     to: mockNetworkManager.factory,
  //     from: createAddress("0x123"),
  //     // function: utils.FunctionFragment.from("setMigrator"),
  //     function: iface.encodeFunctionData("setMigrator", [createAddress("0x1234")]),
  //   })
  //   const findings: Finding[] = await handleTx(tx);
  //   expect(findings).toStrictEqual(setMigrator(createAddress("0x123")))

  // });

  it("should detect setMigrator function calls", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: testFrom,
        to: testMasterchef,
        function: iface.getFunction("setMigrator"),
        arguments: [createAddress("0x12345")]
      })

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([setMigrator(createAddress("0x12345"))])

  });


});