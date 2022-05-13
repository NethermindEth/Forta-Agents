import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { EVENTS } from "./utils";

const createFinding = (name: string, args: any[]) => {
  if (name === "LogDeposit")
    return Finding.fromObject({
      name: "Large deposit into perpetual contract",
      description: "LogDeposit event detected with large quantized Amount",
      alertId: "DYDX-1-1",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args[5].toString(),
        starkKey: args[1].toHexString(),
        token: args[3].toHexString(),
      },
    });
  else if (name === "LogWithdrawalPerformed")
    return Finding.fromObject({
      name: "Large withdrawal into perpetual contract",
      description: "LogWithdrawalPerformed event detected with large quantized Amount",
      alertId: "DYDX-1-2",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args[3].toString(),
        token: args[1].toHexString(),
        recipient: args[4].toLowerCase(),
        ownerKey: args[0].toHexString(),
      },
    });
  else
    return Finding.fromObject({
      name: "Large mint withdrawal into perpetual contract",
      description: "LogMintWithdrawalPerformed event detected with large quantized Amount",
      alertId: "DYDX-1-3",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args[3].toString(),
        token: args[1].toHexString(),
        assetId: args[4].toString(),
        ownerKey: args[0].toHexString(),
      },
    });
};
describe("Large deposits/withdrawals in Perpetual contract", () => {
  let handler: HandleTransaction;
  const threshold = BigNumber.from(100);
  const EVENTS_INTERFACE = new Interface(EVENTS);

  const TEST_DATA = [
    [
      createAddress("0xa1"),
      BigNumber.from(1),
      BigNumber.from(5),
      BigNumber.from(55),
      BigNumber.from(110),
      BigNumber.from(110),
    ], // LogDeposit with large amount
    [
      createAddress("0xa1"),
      BigNumber.from(2),
      BigNumber.from(8),
      BigNumber.from(55),
      BigNumber.from(90),
      BigNumber.from(90),
    ], // LogDeposit with regular amount
    [BigNumber.from(2), BigNumber.from(55), BigNumber.from(200), BigNumber.from(200), createAddress("0x2")], // LogWithdrawalPerformed with large amount
    [BigNumber.from(3), BigNumber.from(55), BigNumber.from(70), BigNumber.from(70), createAddress("0x2")], // LogWithdrawalPerformed with regular amount
    [BigNumber.from(3), BigNumber.from(55), BigNumber.from(210), BigNumber.from(210), BigNumber.from(33)], // LogMintWithdrawalPerformed with regular amount
    [BigNumber.from(3), BigNumber.from(55), BigNumber.from(70), BigNumber.from(70), BigNumber.from(43)], // LogMintWithdrawalPerformed with regular amount
  ];
  const TEST_PERPETUAL = createAddress("0x1");

  beforeAll(() => {
    const mockFetcher = {
      perpetualAddress: TEST_PERPETUAL,
    };

    handler = provideHandleTransaction("STATIC", threshold, mockFetcher as any);
  });

  it("returns empty findings for empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("returns findings if the monitored events are emitted with a large amount", async () => {
    const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[0]);
    const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[2]);
    const log3 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"), TEST_DATA[4]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([
      createFinding("LogDeposit", TEST_DATA[0]),
      createFinding("LogWithdrawalPerformed", TEST_DATA[2]),
      createFinding("LogMintWithdrawalPerformed", TEST_DATA[4]),
    ]);
  });

  it("ignores events with a regular amount", async () => {
    const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[1]);
    const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[3]);
    const log3 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"), TEST_DATA[5]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("ignores events on a different contract", async () => {
    const WRONG_CONTRACT = createAddress("0xdead");

    const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[0]);
    const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[2]);
    const log3 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"), TEST_DATA[4]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(WRONG_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(WRONG_CONTRACT, log2.data, ...log2.topics)
      .addAnonymousEventLog(WRONG_CONTRACT, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });
  it("ignores other events on perpetual contract", async () => {
    const differentIface = new Interface(["event WrongEvent()"]);
    const log = differentIface.encodeEventLog(differentIface.getEvent("WrongEvent"), []);
    const txEvent: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      TEST_PERPETUAL,
      log.data,
      ...log.topics
    );
    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns multiple findings", async () => {
    // LogDeposit with regular amount
    const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[1]);
    // LogWithdrawalPerformed with large amount
    const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[2]);
    // LogMintWithdrawalPerformed with large amount
    const log3 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"), TEST_DATA[4]);
    // LogMintWithdrawalPerformed with regular amount
    const log4 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"), TEST_DATA[5]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics)
      .addAnonymousEventLog(TEST_PERPETUAL, log4.data, ...log4.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([
      createFinding("LogWithdrawalPerformed", TEST_DATA[2]),
      createFinding("LogMintWithdrawalPerformed", TEST_DATA[4]),
    ]);
  });
});
