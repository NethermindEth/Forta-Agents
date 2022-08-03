import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent, Network} from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./network";
import abi from "./abi";

const MOCK_ABI: string[] = ["function mockFunction(address mockAddress)"];

const testMasterchef: string = createAddress("0x01");

const DEFAULT_CONFIG: Record<number, NetworkData> = {
  [Network.MAINNET]: {
    masterChef: testMasterchef,
  },
};

const setMigrator = (_migrator: string): Finding =>
  Finding.fromObject({
    name: "MasterChef Settings",
    description: `setMigrator function called in MasterChef contract.`,
    alertId: "CAKE-5-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    metadata: {
      _migrator: _migrator.toLowerCase(),
    },
  });

const dev = (_devaddr: string): Finding =>
  Finding.fromObject({
    name: "MasterChef Settings",
    description: `dev function called in MasterChef contract.`,
    alertId: "CAKE-5-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    metadata: {
      _devaddr: _devaddr.toLowerCase(),
    },
  });

const add = (_allocPoint: BigNumber, _lpToken: string, _withUpdate: boolean): Finding =>
  Finding.fromObject({
    name: "MasterChef Settings",
    description: `add function called in MasterChef contract.`,
    alertId: "CAKE-5-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    metadata: {
      _allocPoint: _allocPoint.toString(),
      _lpToken: _lpToken.toLowerCase(),
      _withUpdate: _withUpdate.toString(), 
    },
  });

const set = (_pid: BigNumber, _allocPoint: BigNumber, _withUpdate: boolean): Finding =>
  Finding.fromObject({
    name: "MasterChef Settings",
    description: `set function called in MasterChef contract.`,
    alertId: "CAKE-5-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    metadata: {
      _pid: _pid.toString(),
      _allocPoint: _allocPoint.toString(),
      _withUpdate: _withUpdate.toString(), 
    },
  });

const updateMultiplier = (multiplierNumber: BigNumber): Finding =>
  Finding.fromObject({
    name: "MasterChef Settings",
    description: `updateMultiplier function called in MasterChef contract.`,
    alertId: "CAKE-5-5",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    metadata: {
      multiplierNumber: multiplierNumber.toString(),
    },
  });

describe("Set Masterchef Settings bot test suite", () => {
  const iface = new Interface(abi.CAKE_ABI);
  const mockInterface = new Interface(MOCK_ABI);

  const mockNetworkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);

  const handleTx: HandleTransaction = provideHandleTransaction(mockNetworkManager as any);

  it("should ignore empty transactions", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other calls on same contract", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: testMasterchef,
      function: mockInterface.getFunction("mockFunction"),
      arguments: [createAddress("0x12345")],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore setMigrator calls on other contracts", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: createAddress("0x99"),
      function: iface.getFunction("setMigrator"),
      arguments: [createAddress("0x12345")],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect setMigrator function calls", async () => {
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: testMasterchef,
      function: iface.getFunction("setMigrator"),
      arguments: [createAddress("0x12345")],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([setMigrator(createAddress("0x12345"))]);
  });

  it("should detect dev function calls", async () => {
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: testMasterchef,
      function: iface.getFunction("dev"),
      arguments: [createAddress("0x12345")],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([dev(createAddress("0x12345"))]);
  });

  it("should detect add function calls", async () => {
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: testMasterchef,
      function: iface.getFunction("add"),
      arguments: [5, createAddress("0x10"), true],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([add(BigNumber.from(5), createAddress("0x10"), true)]);
  });

  it("should detect set function calls", async () => {
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: testMasterchef,
      function: iface.getFunction("set"),
      arguments: [10, 11, true],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([set(BigNumber.from(10), BigNumber.from(11), true)]);
  });

  it("should detect updateMultiplier function calls", async () => {
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      from: mockNetworkManager.get("masterChef"),
      to: testMasterchef,
      function: iface.getFunction("updateMultiplier"),
      arguments: [20],
    });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([updateMultiplier(BigNumber.from(20))]);
  });

  it("should detect every function call", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: mockNetworkManager.get("masterChef"),
        to: testMasterchef,
        function: iface.getFunction("setMigrator"),
        arguments: [createAddress("0x12345")],
      })
      .addTraces({
        from: mockNetworkManager.get("masterChef"),
        to: testMasterchef,
        function: iface.getFunction("dev"),
        arguments: [createAddress("0x12345")],
      })
      .addTraces({
        from: mockNetworkManager.get("masterChef"),
        to: testMasterchef,
        function: iface.getFunction("add"),
        arguments: [5, createAddress("0x10"), true],
      })
      .addTraces({
        from: mockNetworkManager.get("masterChef"),
        to: testMasterchef,
        function: iface.getFunction("set"),
        arguments: [10, 11, true],
      })
      .addTraces({
        from: mockNetworkManager.get("masterChef"),
        to: testMasterchef,
        function: iface.getFunction("updateMultiplier"),
        arguments: [20],
      });

    const findings: Finding[] = await handleTx(tx);
    expect(findings).toStrictEqual([
      setMigrator(createAddress("0x12345")),
      dev(createAddress("0x12345")),
      add(BigNumber.from(5), createAddress("0x10"), true),
      set(BigNumber.from(10), BigNumber.from(11), true),
      updateMultiplier(BigNumber.from(20)),
    ]);
  });
});
