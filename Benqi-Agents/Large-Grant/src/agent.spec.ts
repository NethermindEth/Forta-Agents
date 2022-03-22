import { BigNumber, BigNumberish } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { QI_BALANCE_ABI, QI_GRANTED_ABI, QI_TOTAL_SUPPLY_ABI, ThresholdMode } from "./utils";
import { MockEthersProvider } from "forta-agent-tools/lib/tests";

const QI_ADDRESS = createAddress("0x1");
const COMPTROLLER_ADDRESS = createAddress("0x2");
const RECIPIENT_ADDRESS = createAddress("0x3");
const IRRELEVANT_ADDRESS = createAddress("0x4");

const COMPTROLLER_IFACE = new Interface([QI_GRANTED_ABI]);
const QI_IFACE = new Interface([QI_TOTAL_SUPPLY_ABI, QI_BALANCE_ABI]);

export function createFinding(
  recipient: string,
  amount: string,
  thresholdMode: ThresholdMode,
  threshold: string
): Finding {
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
      mode: ThresholdMode[thresholdMode],
      threshold,
    },
  });
}

const percentageOf = (value: BigNumberish, percentage: BigNumberish): string => {
  return BigNumber.from(value).mul(percentage).div(100).toString();
};

describe("Delegate-Votes-Monitor Agent test suite", () => {
  describe("absolute threshold", () => {
    describe("handleTransaction", () => {
      const config = {
        thresholdMode: ThresholdMode.ABSOLUTE,
        threshold: "100000",
      };
      const handleTransaction = provideHandleTransaction(QI_ADDRESS, COMPTROLLER_ADDRESS, config);

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

        expect(findings).toStrictEqual([
          createFinding(RECIPIENT_ADDRESS, config.threshold, config.thresholdMode, config.threshold),
        ]);
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
          createFinding(RECIPIENT_ADDRESS, config.threshold, config.thresholdMode, config.threshold),
          createFinding(
            RECIPIENT_ADDRESS,
            BigNumber.from(config.threshold).add(1).toString(),
            config.thresholdMode,
            config.threshold
          ),
        ]);
      });
    });
  });

  describe("percentage total supply threshold", () => {
    describe("handleTransaction", () => {
      const config = {
        thresholdMode: ThresholdMode.PERCENTAGE_TOTAL_SUPPLY,
        threshold: "30",
      };
      const mockProvider = new MockEthersProvider();
      const handleTransaction = provideHandleTransaction(QI_ADDRESS, COMPTROLLER_ADDRESS, config, mockProvider);

      beforeEach(() => {
        mockProvider.clear();
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
        const totalSupply = BigNumber.from("100");
        const block = 100;

        mockProvider.addCallTo(QI_ADDRESS, block, QI_IFACE, "totalSupply", {
          inputs: [],
          outputs: [totalSupply],
        });

        const belowThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(totalSupply, BigNumber.from(config.threshold).sub(1).toString()),
        ]);

        const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(totalSupply, config.threshold),
        ]);

        const txEvent = new TestTransactionEvent()
          .setBlock(block)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, belowThresholdLog.data, ...belowThresholdLog.topics);

        const findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          createFinding(RECIPIENT_ADDRESS, config.threshold, config.thresholdMode, config.threshold),
        ]);
      });

      it("should detect multiple eligible events from the Comptroller contract", async () => {
        const totalSupply = BigNumber.from("100");
        const block = 100;

        mockProvider.addCallTo(QI_ADDRESS, block, QI_IFACE, "totalSupply", {
          inputs: [],
          outputs: [totalSupply],
        });

        const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(totalSupply, config.threshold),
        ]);

        const aboveThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(totalSupply, BigNumber.from(config.threshold).add(1).toString()),
        ]);

        const txEvent = new TestTransactionEvent()
          .setBlock(block)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

        const findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          createFinding(RECIPIENT_ADDRESS, config.threshold, config.thresholdMode, config.threshold),
          createFinding(
            RECIPIENT_ADDRESS,
            BigNumber.from(config.threshold).add(1).toString(),
            config.thresholdMode,
            config.threshold
          ),
        ]);
      });
    });
  });

  describe("percentage comptroller balance threshold", () => {
    describe("handleTransaction", () => {
      const config = {
        thresholdMode: ThresholdMode.PERCENTAGE_COMP_BALANCE,
        threshold: "30",
      };
      const mockProvider = new MockEthersProvider();
      const handleTransaction = provideHandleTransaction(QI_ADDRESS, COMPTROLLER_ADDRESS, config, mockProvider);

      beforeEach(() => {
        mockProvider.clear();
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
        const comptrollerBalance = BigNumber.from("100");
        const block = 100;

        mockProvider.addCallTo(QI_ADDRESS, block - 1, QI_IFACE, "balanceOf", {
          inputs: [COMPTROLLER_ADDRESS],
          outputs: [comptrollerBalance],
        });

        const belowThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(comptrollerBalance, BigNumber.from(config.threshold).sub(1).toString()),
        ]);

        const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(comptrollerBalance, config.threshold),
        ]);

        const txEvent = new TestTransactionEvent()
          .setBlock(block)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, belowThresholdLog.data, ...belowThresholdLog.topics);

        const findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          createFinding(RECIPIENT_ADDRESS, config.threshold, config.thresholdMode, config.threshold),
        ]);
      });

      it("should detect multiple eligible events from the Comptroller contract", async () => {
        const comptrollerBalance = BigNumber.from("100");
        const block = 100;

        mockProvider.addCallTo(QI_ADDRESS, block - 1, QI_IFACE, "balanceOf", {
          inputs: [COMPTROLLER_ADDRESS],
          outputs: [comptrollerBalance],
        });

        const exactThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(comptrollerBalance, config.threshold),
        ]);

        const aboveThresholdLog = COMPTROLLER_IFACE.encodeEventLog(COMPTROLLER_IFACE.getEvent("QiGranted"), [
          RECIPIENT_ADDRESS,
          percentageOf(comptrollerBalance, BigNumber.from(config.threshold).add(1).toString()),
        ]);

        const txEvent = new TestTransactionEvent()
          .setBlock(block)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
          .addAnonymousEventLog(COMPTROLLER_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics);

        const findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          createFinding(RECIPIENT_ADDRESS, config.threshold, config.thresholdMode, config.threshold),
          createFinding(
            RECIPIENT_ADDRESS,
            BigNumber.from(config.threshold).add(1).toString(),
            config.thresholdMode,
            config.threshold
          ),
        ]);
      });
    });
  });
});
