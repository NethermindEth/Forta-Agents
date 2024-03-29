import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface } from "@ethersproject/abi";
import abi from "./abi";

const pause = (time: BigNumber): Finding =>
  Finding.fromObject({
    name: "PancakePredictionV2 Operations",
    description: "Pause event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    alertId: "CAKE-9-1",
    metadata: {
      time: time.toString(),
    },
  });

const unpause = (time: BigNumber): Finding =>
  Finding.fromObject({
    name: "PancakePredictionV2 Operations",
    description: "Unpause event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    alertId: "CAKE-9-2",
    metadata: {
      time: time.toString(),
    },
  });

const newOperatorAddress = (address: string): Finding =>
  Finding.fromObject({
    name: "PancakePredictionV2 Operations",
    description: "NewOperatorAddress event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    alertId: "CAKE-9-3",
    metadata: {
      address,
    },
  });

const newAdminAddress = (address: string): Finding =>
  Finding.fromObject({
    name: "PancakePredictionV2 Operations",
    description: "NewAdminAddress event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    alertId: "CAKE-9-4",
    metadata: {
      address,
    },
  });

const newOracle = (address: string): Finding =>
  Finding.fromObject({
    name: "PancakePredictionV2 Operations",
    description: "NewOracle event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    alertId: "CAKE-9-5",
    metadata: {
      address,
    },
  });

const newTreasuryFee = (time: BigNumber, fee: BigNumber): Finding =>
  Finding.fromObject({
    name: "PancakePredictionV2 Operations",
    description: "NewTreasuryFee event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    alertId: "CAKE-9-6",
    metadata: {
      time: time.toString(),
      fee: fee.toString(),
    },
  });


const mockEvent: string[] = [
  "event StartRound(uint256 indexed epoch)",
];

describe("PancakePredictionV2-Operations bot tests suite", () => {
  const iface = new Interface(abi.CAKE);
  const mockInterface = new Interface(mockEvent); 
  const cake: string = createAddress("0x01");
  const handler: HandleTransaction = provideHandleTransaction(cake);

  it("should ignore empty txns", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on same contract", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(mockInterface.getEvent("StartRound"), cake, [10]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]); 
  });

  it("should detect Pause events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("Pause"), cake, [10])
      .addInterfaceEventLog(iface.getEvent("Pause"), createAddress("0x111"), [
        // 0x111 should be ignored
        11,
      ])
      .addInterfaceEventLog(iface.getEvent("Pause"), cake, [12]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([pause(BigNumber.from(10)), pause(BigNumber.from(12))]);
  });

  it("should detect Unpause events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("Unpause"), cake, [10])
      .addInterfaceEventLog(iface.getEvent("Unpause"), createAddress("0x111"), [
        // 0x111 should be ignored
        11,
      ])
      .addInterfaceEventLog(iface.getEvent("Unpause"), cake, [12]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([unpause(BigNumber.from(10)), unpause(BigNumber.from(12))]);
  });

  it("should detect NewOperatorAddress events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewOperatorAddress"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewOperatorAddress"), createAddress("0x111"), [
        // 0x111 should be ignored
        createAddress("0x2"),
      ])
      .addInterfaceEventLog(iface.getEvent("NewOperatorAddress"), cake, [createAddress("0x3")]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      newOperatorAddress(createAddress("0x1")),
      newOperatorAddress(createAddress("0x3")),
    ]);
  });

  it("should detect NewAdminAddress events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), createAddress("0x111"), [
        // 0x111 should be ignored
        createAddress("0x2"),
      ])
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), cake, [createAddress("0x3")]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([newAdminAddress(createAddress("0x1")), newAdminAddress(createAddress("0x3"))]);
  });

  it("should detect NewOracle events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewOracle"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewOracle"), createAddress("0x111"), [
        // 0x111 should be ignored
        createAddress("0x2"),
      ])
      .addInterfaceEventLog(iface.getEvent("NewOracle"), cake, [createAddress("0x3")]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([newOracle(createAddress("0x1")), newOracle(createAddress("0x3"))]);
  });

  it("should detect NewTreasuryFee events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewTreasuryFee"), cake, [10, 20])
      .addInterfaceEventLog(
        iface.getEvent("NewTreasuryFee"),
        createAddress("0x111"),
        [
          // 0x111 should be ignored
          30, 40,
        ]
      )
      .addInterfaceEventLog(iface.getEvent("NewTreasuryFee"), cake, [50, 60]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      newTreasuryFee(BigNumber.from(10), BigNumber.from(20)),
      newTreasuryFee(BigNumber.from(50), BigNumber.from(60)),
    ]);
  });

  it("should detect all of the events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("Pause"), cake, [10])
      .addInterfaceEventLog(iface.getEvent("Unpause"), cake, [10])
      .addInterfaceEventLog(iface.getEvent("NewOperatorAddress"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewOracle"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewTreasuryFee"), cake, [10, 20]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      pause(BigNumber.from(10)),
      unpause(BigNumber.from(10)),
      newOperatorAddress(createAddress("0x1")),
      newAdminAddress(createAddress("0x1")),
      newOracle(createAddress("0x1")),
      newTreasuryFee(BigNumber.from(10), BigNumber.from(20)),
    ]);
  });
});
