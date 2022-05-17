import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import BalanceFetcher from "./balance.fetcher";
import { BotConfig } from "./config";
import { ERC20_TOKEN_ABI, EVENTS } from "./utils";

const createFinding = (name: string, args: any[], token: string) => {
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
        token: token,
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
        token: token,
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
        token: token,
        assetId: args[4].toString(),
        ownerKey: args[0].toHexString(),
      },
    });
};
const createSuspiciousFinding = (name: string, token: string, args: any[]): Finding => {
  let metadata =
    name === "LogDeposit"
      ? {
          quantizedAmount: args[5].toString(),
          starkKey: args[1].toHexString(),
          token: token,
        }
      : { quantizedAmount: args[3].toString(), starkKey: args[0].toHexString(), token: token };

  return Finding.fromObject({
    name: "Suspicious assetType detected on perpetual contract",
    description: `${name} event detected with an asset different from  the system asset`,
    alertId: "DYDX-1-4",
    protocol: "dYdX",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: metadata,
  });
};

describe("Large deposits/withdrawals in Perpetual contract", () => {
  let handler: HandleTransaction;
  const mockProvider = new MockEthersProvider();

  const EVENTS_INTERFACE = new Interface(EVENTS);
  const TEST_PERPETUAL = createAddress("0x1");
  const TEST_ASSET = BigNumber.from(0xfefe);
  const TEST_TOKEN = createAddress("0xaebe");
  const ALERT_ASSET = BigNumber.from(0x3536);

  const TEST_DATA = [
    [createAddress("0xa1"), BigNumber.from(1), BigNumber.from(5), TEST_ASSET, BigNumber.from(110), BigNumber.from(110)], // LogDeposit with large amount
    [createAddress("0xa1"), BigNumber.from(2), BigNumber.from(8), TEST_ASSET, BigNumber.from(90), BigNumber.from(90)], // LogDeposit with regular amount
    [BigNumber.from(2), TEST_ASSET, BigNumber.from(200), BigNumber.from(200), createAddress("0x2")], // LogWithdrawalPerformed with large amount
    [BigNumber.from(3), TEST_ASSET, BigNumber.from(70), BigNumber.from(70), createAddress("0x2")], // LogWithdrawalPerformed with regular amount
    [BigNumber.from(3), TEST_ASSET, BigNumber.from(210), BigNumber.from(210), BigNumber.from(33)], // LogMintWithdrawalPerformed with large amount
    [BigNumber.from(3), TEST_ASSET, BigNumber.from(70), BigNumber.from(70), BigNumber.from(43)], // LogMintWithdrawalPerformed with regular amount
  ];
  // Data that generates suspicious findings
  const ALERT_DATA = [
    [createAddress("0x9"), BigNumber.from(1), BigNumber.from(5), ALERT_ASSET, BigNumber.from(90), BigNumber.from(80)], // LogDeposit
    [BigNumber.from(3), ALERT_ASSET, BigNumber.from(70), BigNumber.from(70), createAddress("0x2")], // LogWithdrawalPerformed
    [BigNumber.from(3), ALERT_ASSET, BigNumber.from(210), BigNumber.from(210), BigNumber.from(33)], // LogMintWithdrawalPerformed
  ];

  const mockNetworkManager = {
    perpetualProxy: TEST_PERPETUAL,
  };
  const mockBalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);

  describe("STATIC mode", () => {
    beforeAll(() => {
      const STATIC_CONFIG: BotConfig = {
        mode: "STATIC",
        thresholdData: BigNumber.from(100),
      };
      mockBalanceFetcher.setData(TEST_ASSET, TEST_TOKEN);
      handler = provideHandleTransaction(STATIC_CONFIG, mockBalanceFetcher);
    });

    it("returns empty findings for empty transactions", async () => {
      const tx: TransactionEvent = new TestTransactionEvent();

      const findings: Finding[] = await handler(tx);
      expect(findings).toStrictEqual([]);
    });

    it("returns findings if the monitored events are emitted with a large amount", async () => {
      const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[0]);
      const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[2]);
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[4]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics);

      const findings: Finding[] = await handler(txEvent);
      expect(findings).toStrictEqual([
        createFinding("LogDeposit", TEST_DATA[0], TEST_TOKEN),
        createFinding("LogWithdrawalPerformed", TEST_DATA[2], TEST_TOKEN),
        createFinding("LogMintWithdrawalPerformed", TEST_DATA[4], TEST_TOKEN),
      ]);
    });

    it("ignores events with a regular amount", async () => {
      const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[1]);
      const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[3]);
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[5]
      );

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
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[4]
      );

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
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[4]
      );
      // LogMintWithdrawalPerformed with regular amount
      const log4 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[5]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log4.data, ...log4.topics);

      const findings: Finding[] = await handler(txEvent);
      expect(findings).toStrictEqual([
        createFinding("LogWithdrawalPerformed", TEST_DATA[2], TEST_TOKEN),
        createFinding("LogMintWithdrawalPerformed", TEST_DATA[4], TEST_TOKEN),
      ]);
    });
    it("should return high severity findings for events with different assetType", async () => {
      // LogDeposit
      const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), ALERT_DATA[0]);
      // LogWithdrawalPerformed
      const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), ALERT_DATA[1]);
      // LogMintWithdrawalPerformed
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        ALERT_DATA[2]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics);

      const findings: Finding[] = await handler(txEvent);
      expect(findings).toStrictEqual([
        createSuspiciousFinding("LogDeposit", ALERT_ASSET.toHexString(), ALERT_DATA[0]),
        createSuspiciousFinding("LogWithdrawalPerformed", ALERT_ASSET.toHexString(), ALERT_DATA[1]),
        createSuspiciousFinding("LogMintWithdrawalPerformed", ALERT_ASSET.toHexString(), ALERT_DATA[2]),
      ]);
    });
  });

  describe("PERCENTAGE mode", () => {
    const TEST_BALANCE = BigNumber.from(1000);
    const TEST_BLOCK = 123;

    beforeAll(() => {
      const DYNAMIC_CONFIG: BotConfig = {
        mode: "PERCENTAGE",
        thresholdData: BigNumber.from(10),
      };
      mockProvider.addCallTo(TEST_TOKEN, TEST_BLOCK - 1, new Interface(ERC20_TOKEN_ABI), "balanceOf", {
        inputs: [TEST_PERPETUAL],
        outputs: [TEST_BALANCE],
      });

      mockBalanceFetcher.setData(TEST_ASSET, TEST_TOKEN);
      handler = provideHandleTransaction(DYNAMIC_CONFIG, mockBalanceFetcher);
    });

    it("returns empty findings for empty transactions", async () => {
      const tx: TransactionEvent = new TestTransactionEvent();

      const findings: Finding[] = await handler(tx);
      expect(findings).toStrictEqual([]);
    });

    it("returns findings if the monitored events are emitted with a large amount", async () => {
      const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[0]);
      const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[2]);
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[4]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCK)
        .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics);

      const findings: Finding[] = await handler(txEvent);
      expect(findings).toStrictEqual([
        createFinding("LogDeposit", TEST_DATA[0], TEST_TOKEN),
        createFinding("LogWithdrawalPerformed", TEST_DATA[2], TEST_TOKEN),
        createFinding("LogMintWithdrawalPerformed", TEST_DATA[4], TEST_TOKEN),
      ]);
    });

    it("ignores events with a regular amount", async () => {
      const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), TEST_DATA[1]);
      const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), TEST_DATA[3]);
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[5]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCK)
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
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[4]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCK)
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
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[4]
      );
      // LogMintWithdrawalPerformed with regular amount
      const log4 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        TEST_DATA[5]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCK)
        .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log4.data, ...log4.topics);

      const findings: Finding[] = await handler(txEvent);
      expect(findings).toStrictEqual([
        createFinding("LogWithdrawalPerformed", TEST_DATA[2], TEST_TOKEN),
        createFinding("LogMintWithdrawalPerformed", TEST_DATA[4], TEST_TOKEN),
      ]);
    });
    it("should return high severity findings for events with different assetType", async () => {
      // LogDeposit
      const log1 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogDeposit"), ALERT_DATA[0]);
      // LogWithdrawalPerformed
      const log2 = EVENTS_INTERFACE.encodeEventLog(EVENTS_INTERFACE.getEvent("LogWithdrawalPerformed"), ALERT_DATA[1]);
      // LogMintWithdrawalPerformed
      const log3 = EVENTS_INTERFACE.encodeEventLog(
        EVENTS_INTERFACE.getEvent("LogMintWithdrawalPerformed"),
        ALERT_DATA[2]
      );

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCK)
        .addAnonymousEventLog(TEST_PERPETUAL, log1.data, ...log1.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log2.data, ...log2.topics)
        .addAnonymousEventLog(TEST_PERPETUAL, log3.data, ...log3.topics);

      const findings: Finding[] = await handler(txEvent);
      expect(findings).toStrictEqual([
        createSuspiciousFinding("LogDeposit", ALERT_ASSET.toHexString(), ALERT_DATA[0]),
        createSuspiciousFinding("LogWithdrawalPerformed", ALERT_ASSET.toHexString(), ALERT_DATA[1]),
        createSuspiciousFinding("LogMintWithdrawalPerformed", ALERT_ASSET.toHexString(), ALERT_DATA[2]),
      ]);
    });
  });
});
