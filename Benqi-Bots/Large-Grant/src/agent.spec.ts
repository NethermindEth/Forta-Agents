import { BigNumber, BigNumberish } from "ethers";
import { Interface } from "ethers/lib/utils";
import { JsonRpcProvider } from "@ethersproject/providers/lib/json-rpc-provider";
import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { QI_BALANCE_ABI, QI_GRANTED_ABI, QI_TOTAL_SUPPLY, ThresholdMode } from "./utils";
import { MockEthersProvider } from "forta-agent-tools/lib/tests";

const QI_ADDRESS = createAddress("0x1");
const COMPTROLLER_ADDRESS = createAddress("0x2");
const RECIPIENT_ADDRESS = createAddress("0x3");
const IRRELEVANT_ADDRESS = createAddress("0x4");

const COMPTROLLER_IFACE = new Interface([QI_GRANTED_ABI]);
const QI_IFACE = new Interface([QI_BALANCE_ABI]);

export function createFinding(recipient: string, amount: string): Finding {
  return Finding.fromObject({
    name: "Large QI Grant",
    description: "There was a large QI Grant in the BENQI Comptroller contract",
    alertId: "BENQI-4",
    protocol: "Benqi Finance",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      recipient,
      amount: amount,
    },
  });
}

const percentageOf = (value: BigNumberish, percentage: BigNumberish): string => {
  return BigNumber.from(value).mul(percentage).div(100).toString();
};

describe("Delegate-Votes-Monitor Agent test suite", () => {
  describe("absolute threshold", () => {
    const config = {
      qiAddress: QI_ADDRESS,
      comptrollerAddress: COMPTROLLER_ADDRESS,
      thresholdMode: ThresholdMode.ABSOLUTE,
      threshold: "100000",
    };
    let handleTransaction: HandleTransaction;

    beforeEach(() => {
      handleTransaction = provideHandleTransaction(config);
    });

    it("should ignore empty transactions", async () => {
      const txEvent = new TestTransactionEvent();
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore other events from the Comptroller contract", async () => {
      const irrelevantIface = new Interface(["event IrrelevantEvent()"]);
      const log = irrelevantIface.encodeEventLog(irrelevantIface.getEvent("IrrelevantEvent"), []);

      const txEvent = new TestTransactionEvent().addAnonymousEventLog(COMPTROLLER_ADDRESS, log.data, ...log.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore QiGranted events from other contracts", async () => {
      const alertLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        config.threshold,
      ]);

      const txEvent = new TestTransactionEvent().addAnonymousEventLog(
        IRRELEVANT_ADDRESS,
        alertLog.data,
        ...alertLog.topics
      );

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore QiGranted events from the Comptroller contract that do not meet the threshold", async () => {
      const belowThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        BigNumber.from(config.threshold).sub(1).toString(),
      ]);

      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        config.threshold,
      ]);

      const txEvent = new TestTransactionEvent()
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, belowThresholdLog.data, ...belowThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([createFinding(RECIPIENT_ADDRESS, config.threshold)]);
    });

    it("should detect multiple eligible events from the Comptroller contract", async () => {
      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        config.threshold,
      ]);

      const aboveThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        BigNumber.from(config.threshold).add(1).toString(),
      ]);

      const txEvent = new TestTransactionEvent()
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, config.threshold),
        createFinding(RECIPIENT_ADDRESS, BigNumber.from(config.threshold).add(1).toString()),
      ]);
    });
  });

  describe("percentage total supply threshold", () => {
    const config = {
      qiAddress: QI_ADDRESS,
      comptrollerAddress: COMPTROLLER_ADDRESS,
      thresholdMode: ThresholdMode.PERCENTAGE_TOTAL_SUPPLY,
      threshold: "30",
    };
    let handleTransaction: HandleTransaction;

    beforeEach(() => {
      handleTransaction = provideHandleTransaction(config);
    });

    it("should ignore empty transactions", async () => {
      const txEvent = new TestTransactionEvent();
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore other events from the Comptroller contract", async () => {
      const irrelevantIface = new Interface(["event IrrelevantEvent()"]);
      const log = irrelevantIface.encodeEventLog(irrelevantIface.getEvent("IrrelevantEvent"), []);

      const txEvent = new TestTransactionEvent().addAnonymousEventLog(COMPTROLLER_ADDRESS, log.data, ...log.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore QiGranted events from other contracts", async () => {
      const alertLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        config.threshold,
      ]);

      const txEvent = new TestTransactionEvent().addAnonymousEventLog(
        IRRELEVANT_ADDRESS,
        alertLog.data,
        ...alertLog.topics
      );

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore QiGranted events from the Comptroller contract that do not meet the threshold", async () => {
      const belowThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(QI_TOTAL_SUPPLY, BigNumber.from(config.threshold).sub(1)),
      ]);

      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(QI_TOTAL_SUPPLY, config.threshold),
      ]);

      const txEvent = new TestTransactionEvent()
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, belowThresholdLog.data, ...belowThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, percentageOf(QI_TOTAL_SUPPLY, config.threshold)),
      ]);
    });

    it("should detect multiple eligible events from the Comptroller contract", async () => {
      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(QI_TOTAL_SUPPLY, config.threshold),
      ]);

      const aboveThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(QI_TOTAL_SUPPLY, BigNumber.from(config.threshold).add(1)),
      ]);

      const txEvent = new TestTransactionEvent()
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, percentageOf(QI_TOTAL_SUPPLY, config.threshold)),
        createFinding(RECIPIENT_ADDRESS, percentageOf(QI_TOTAL_SUPPLY, BigNumber.from(config.threshold).add(1))),
      ]);
    });
  });

  describe("percentage comptroller balance threshold", () => {
    const config = {
      qiAddress: QI_ADDRESS,
      comptrollerAddress: COMPTROLLER_ADDRESS,
      thresholdMode: ThresholdMode.PERCENTAGE_COMPTROLLER_BALANCE,
      threshold: "30",
    };
    const initialBlock = 100;
    const initialComptrollerBalance = BigNumber.from("500");
    const nextComptrollerBalance = BigNumber.from("1000");

    let handleTransaction: HandleTransaction;
    const mockProvider = new MockEthersProvider();

    mockProvider.addCallTo(QI_ADDRESS, initialBlock - 1, QI_IFACE, "balanceOf", {
      inputs: [COMPTROLLER_ADDRESS],
      outputs: [initialComptrollerBalance],
    });

    mockProvider.addCallTo(QI_ADDRESS, initialBlock, QI_IFACE, "balanceOf", {
      inputs: [COMPTROLLER_ADDRESS],
      outputs: [nextComptrollerBalance],
    });

    beforeEach(() => {
      const provider = mockProvider as unknown as JsonRpcProvider;
      handleTransaction = provideHandleTransaction(config, provider);

      mockProvider.call.mockClear();
    });

    it("should ignore empty transactions", async () => {
      const txEvent = new TestTransactionEvent().setBlock(initialBlock);
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore other events from the Comptroller contract", async () => {
      const irrelevantIface = new Interface(["event IrrelevantEvent()"]);
      const log = irrelevantIface.encodeEventLog(irrelevantIface.getEvent("IrrelevantEvent"), []);

      const txEvent = new TestTransactionEvent()
        .setBlock(initialBlock)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, log.data, ...log.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore QiGranted events from other contracts", async () => {
      const alertLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        config.threshold,
      ]);

      const txEvent = new TestTransactionEvent()
        .setBlock(initialBlock)
        .addAnonymousEventLog(IRRELEVANT_ADDRESS, alertLog.data, ...alertLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore QiGranted events from the Comptroller contract that do not meet the threshold", async () => {
      const belowThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(initialComptrollerBalance, BigNumber.from(config.threshold).sub(1)),
      ]);

      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(initialComptrollerBalance, config.threshold),
      ]);

      const txEvent = new TestTransactionEvent()
        .setBlock(initialBlock)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, belowThresholdLog.data, ...belowThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, percentageOf(initialComptrollerBalance, config.threshold)),
      ]);
    });

    it("should detect multiple eligible events from the Comptroller contract", async () => {
      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(initialComptrollerBalance, config.threshold),
      ]);

      const aboveThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(initialComptrollerBalance, BigNumber.from(config.threshold).add(1)),
      ]);

      const txEvent = new TestTransactionEvent()
        .setBlock(initialBlock)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, percentageOf(initialComptrollerBalance, config.threshold)),
        createFinding(
          RECIPIENT_ADDRESS,
          percentageOf(initialComptrollerBalance, BigNumber.from(config.threshold).add(1))
        ),
      ]);
      expect(mockProvider.call).toHaveBeenCalledTimes(1);
      expect(mockProvider.call).toHaveBeenCalledWith(
        {
          data: QI_IFACE.encodeFunctionData(QI_IFACE.getFunction("balanceOf"), [COMPTROLLER_ADDRESS]),
          to: QI_ADDRESS,
        },
        initialBlock - 1
      );
    });

    it("should update the Comptroller's QI balance", async () => {
      const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(initialComptrollerBalance, config.threshold),
      ]);

      const aboveThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
        RECIPIENT_ADDRESS,
        percentageOf(nextComptrollerBalance, config.threshold),
      ]);

      const txEvent = new TestTransactionEvent()
        .setBlock(initialBlock)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      const nextTxEvent = new TestTransactionEvent()
        .setBlock(initialBlock + 1)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

      const nextFindings = await handleTransaction(nextTxEvent);

      // both logs should trigger findings
      expect(findings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, percentageOf(initialComptrollerBalance, config.threshold)),
        createFinding(RECIPIENT_ADDRESS, percentageOf(nextComptrollerBalance, config.threshold)),
      ]);
      // after the balance is updated, exactThresholdLog should not trigger a finding, since
      // nextComptrollerBalance > initialComptrollerBalance
      expect(nextFindings).toStrictEqual([
        createFinding(RECIPIENT_ADDRESS, percentageOf(nextComptrollerBalance, config.threshold)),
      ]);
      expect(mockProvider.call).toHaveBeenCalledTimes(2);
      expect(mockProvider.call).toHaveBeenNthCalledWith(
        1,
        {
          data: QI_IFACE.encodeFunctionData(QI_IFACE.getFunction("balanceOf"), [COMPTROLLER_ADDRESS]),
          to: QI_ADDRESS,
        },
        initialBlock - 1 // previous block
      );
      expect(mockProvider.call).toHaveBeenNthCalledWith(
        2,
        {
          data: QI_IFACE.encodeFunctionData(QI_IFACE.getFunction("balanceOf"), [COMPTROLLER_ADDRESS]),
          to: QI_ADDRESS,
        },
        initialBlock // previous block
      );
    });
  });
});
