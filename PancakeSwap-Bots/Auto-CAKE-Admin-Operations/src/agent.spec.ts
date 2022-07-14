import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface, Fragment, EventFragment } from "@ethersproject/abi";
import abi from "./abi";

const pause = (time: BigNumber): Finding =>
  Finding.fromObject({
    name: "CAKE Operations",
    description: "Pause event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "CAKE-9-1",
    metadata: {
      time: `${time}`,
    },
  });

const unpause = (time: BigNumber): Finding =>
  Finding.fromObject({
    name: "CAKE Operations",
    description: "Unpause event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "CAKE-9-2",
    metadata: {
      time: `${time}`,
    },
  });

const newOperatorAddress = (address: string): Finding =>
  Finding.fromObject({
    name: "CAKE Operations",
    description: "NewOperatorAddress event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "CAKE-9-3",
    metadata: {
      address,
    },
  });

const newAdminAddress = (address: string): Finding =>
  Finding.fromObject({
    name: "CAKE Operations",
    description: "NewAdminAddress event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "CAKE-9-4",
    metadata: {
      address,
    },
  });

const newOracle = (address: string): Finding =>
  Finding.fromObject({
    name: "CAKE Operations",
    description: "NewOracle event emitted",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    alertId: "CAKE-9-5",
    metadata: {
      address,
    },
  });

describe("CAKE-Operations agent tests suite", () => {
  const iface = new Interface(abi.CAKE);

  it("should ignore empty txns", async () => {
    const cake: string = createAddress("0xcake");
    const handler: HandleTransaction = provideHandleTransaction(cake);
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect Pause events", async () => {
    const cake: string = createAddress("0xcake1");
    const handler: HandleTransaction = provideHandleTransaction(cake);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("Pause"), cake, [10])
      .addInterfaceEventLog(iface.getEvent("Pause"), createAddress("0xNotCake"), [
        // 0xNotCake should be ignored
        11,
      ])
      .addInterfaceEventLog(iface.getEvent("Pause"), cake, [12]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([pause(BigNumber.from(10)), pause(BigNumber.from(12))]);
  });

  it("should detect Unpause events", async () => {
    const cake: string = createAddress("0xcake2");
    const handler: HandleTransaction = provideHandleTransaction(cake);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("Unpause"), cake, [10])
      .addInterfaceEventLog(iface.getEvent("Unpause"), createAddress("0xNotCake"), [
        // 0xNotCake should be ignored
        11,
      ])
      .addInterfaceEventLog(iface.getEvent("Unpause"), cake, [12]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([unpause(BigNumber.from(10)), unpause(BigNumber.from(12))]);
  });

  it("should detect NewOperatorAddress events", async () => {
    const cake: string = createAddress("0xcake3");
    const handler: HandleTransaction = provideHandleTransaction(cake);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewOperatorAddress"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewOperatorAddress"), createAddress("0xNotCake"), [
        // 0xNotCake should be ignored
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
    const cake: string = createAddress("0xcake4");
    const handler: HandleTransaction = provideHandleTransaction(cake);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), createAddress("0xNotCake"), [
        // 0xNotCake should be ignored
        createAddress("0x2"),
      ])
      .addInterfaceEventLog(iface.getEvent("NewAdminAddress"), cake, [createAddress("0x3")]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([newAdminAddress(createAddress("0x1")), newAdminAddress(createAddress("0x3"))]);
  });

  it("should detect NewOracle events", async () => {
    const cake: string = createAddress("0xcake5");
    const handler: HandleTransaction = provideHandleTransaction(cake);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addInterfaceEventLog(iface.getEvent("NewOracle"), cake, [createAddress("0x1")])
      .addInterfaceEventLog(iface.getEvent("NewOracle"), createAddress("0xNotCake"), [
        // 0xNotCake should be ignored
        createAddress("0x2"),
      ])
      .addInterfaceEventLog(iface.getEvent("NewOracle"), cake, [createAddress("0x3")]);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([newOracle(createAddress("0x1")), newOracle(createAddress("0x3"))]);
  });



  
});
