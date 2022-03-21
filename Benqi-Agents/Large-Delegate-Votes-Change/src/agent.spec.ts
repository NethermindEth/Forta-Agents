import { BigNumber, BigNumberish } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { DELEGATE_VOTES_CHANGED_ABI } from "./constants";

const PERCENTAGE_THRESHOLD = BigNumber.from("50");

const QI_ADDRESS = createAddress("0x1");
const DELEGATE_ADDRESS = createAddress("0x2");

const QI_IFACE = new Interface([DELEGATE_VOTES_CHANGED_ABI]);

const createFinding = (delegate: string, previousBalance: string, newBalance: string): Finding => {
  return Finding.fromObject({
    name: "Large increase in delegate votes",
    description: `There was a >= ${PERCENTAGE_THRESHOLD.toString()}% increase in delegate votes based on the previous amount`,
    alertId: "BENQI-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      delegate: delegate.toLowerCase(),
      previousBalance,
      newBalance,
    },
  });
};

const increaseByPercentage = (value: BigNumberish, percentage: BigNumberish): string => {
  return BigNumber.from(100).add(percentage).mul(value).div(100).toString();
};

describe("Delegate-Votes-Monitor Agent test suite", () => {
  const handleTransaction = provideHandleTransaction(QI_ADDRESS, PERCENTAGE_THRESHOLD);

  describe("handleTransaction", () => {
    it("should ignore empty transactions", async () => {
      const txEvent = new TestTransactionEvent();
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore other events from the QI contract", async () => {
      const irrelevantIface = new Interface(["event IrrelevantEvent()"]);
      const log = irrelevantIface.encodeEventLog(irrelevantIface.getEvent("IrrelevantEvent"), []);

      const txEvent = new TestTransactionEvent();
      txEvent.addAnonymousEventLog(QI_ADDRESS, log.data, ...log.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore DelegateVotesChanged events from other contracts", async () => {
      const alertLog = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "100", // previousBalance
        increaseByPercentage("100", PERCENTAGE_THRESHOLD), // newBalance
      ]);

      const txEvent = new TestTransactionEvent();
      txEvent.addAnonymousEventLog(createAddress("0xd"), alertLog.data, ...alertLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should ignore DelegateVotesChanged events from the QI contract that do not meet the threshold", async () => {
      const exactThresholdLog = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "100", // previousBalance
        increaseByPercentage("100", PERCENTAGE_THRESHOLD), // newBalance
      ]);

      const aboveThresholdLog = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "100", // previousBalance
        increaseByPercentage("100", PERCENTAGE_THRESHOLD.add(10)), // newBalance
      ]);

      const belowThresholdLog = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "100", // previousBalance
        increaseByPercentage("100", PERCENTAGE_THRESHOLD.sub(1)), // newBalance
      ]);

      const txEvent = new TestTransactionEvent();
      txEvent
        .addAnonymousEventLog(QI_ADDRESS, exactThresholdLog.data, ...exactThresholdLog.topics)
        .addAnonymousEventLog(QI_ADDRESS, aboveThresholdLog.data, ...aboveThresholdLog.topics)
        .addAnonymousEventLog(QI_ADDRESS, belowThresholdLog.data, ...belowThresholdLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(DELEGATE_ADDRESS, "100", increaseByPercentage("100", PERCENTAGE_THRESHOLD)),
        createFinding(DELEGATE_ADDRESS, "100", increaseByPercentage("100", PERCENTAGE_THRESHOLD.add(10))),
      ]);
    });

    it("should detect multiple eligible events from the QI contract", async () => {
      const alertLog1 = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "100", // previousBalance
        increaseByPercentage("100", PERCENTAGE_THRESHOLD), // newBalance
      ]);

      const alertLog2 = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "200", // previousBalance
        increaseByPercentage("200", PERCENTAGE_THRESHOLD.add(5)), // newBalance
      ]);

      const alertLog3 = QI_IFACE.encodeEventLog(QI_IFACE.getEvent("DelegateVotesChanged"), [
        DELEGATE_ADDRESS, // delegate
        "300", // previousBalance
        increaseByPercentage("300", PERCENTAGE_THRESHOLD.add(10)), // newBalance
      ]);

      const txEvent = new TestTransactionEvent();
      txEvent
        .addAnonymousEventLog(QI_ADDRESS, alertLog1.data, ...alertLog1.topics)
        .addAnonymousEventLog(QI_ADDRESS, alertLog2.data, ...alertLog2.topics)
        .addAnonymousEventLog(QI_ADDRESS, alertLog3.data, ...alertLog3.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(DELEGATE_ADDRESS, "100", increaseByPercentage("100", PERCENTAGE_THRESHOLD)),
        createFinding(DELEGATE_ADDRESS, "200", increaseByPercentage("200", PERCENTAGE_THRESHOLD.add(5))),
        createFinding(DELEGATE_ADDRESS, "300", increaseByPercentage("300", PERCENTAGE_THRESHOLD.add(10))),
      ]);
    });
  });
});
