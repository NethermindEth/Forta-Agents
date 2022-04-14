import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideBigQueuedPriceDeviationHandler, { createFinding } from "./big.queued.price.deviation";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";

const ADDRESSES = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3"), createAddress("0x4")];
const CONTRACT_ADDRESSES: any = (addresses: string[]) => {
  return { get: () => addresses };
};

const PEEK_FUNCTION_SELECTOR = "0x59e02dd7";
const ABI = new utils.Interface(["function peek() public view returns (bytes32, bool)"]);
const logIface = new utils.Interface(["event LogValue(bytes32 val)"]);

describe("Big deviation queued price Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return an empty finding if there are not traces", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));

    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the new price deviates too much", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[0],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("107"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[0], log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(ADDRESSES[0], 100, 107)]);
  });

  it("should return an empty finding if the new price doesn't deviate too much", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[0],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("105"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[0], log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if the Peek function wasn't called from the correct contract", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES([ADDRESSES[0]]));
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[1],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("108"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[0], log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if Peek function wasn't called", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: ADDRESSES[0],
      input: "0x11111111",
      output: ABI.encodeFunctionResult("peek", [formatBytes32String("108"), true]),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if the Peek call wasn't successful", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: ADDRESSES[0],
      input: PEEK_FUNCTION_SELECTOR,
      output: ABI.encodeFunctionResult("peek", [formatBytes32String("108"), false]),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if the event with deviated price was not emitted from the correct address", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));
    const log1 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);
    const log2 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("105")]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[0],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("108"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[1], log1.data, ...log1.topics)
      .addAnonymousEventLog(ADDRESSES[0], log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple finding if there are multiple Oracles with big deviations in new prices", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));

    const log1 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);
    const log2 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("90")]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[0],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("108"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[0], log1.data, ...log1.topics)
      .addTraces({
        from: ADDRESSES[1],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("118"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[1], log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(ADDRESSES[0], 100, 108), createFinding(ADDRESSES[1], 90, 118)]);
  });

  it("should only return findings from the Oracles with big deviations on new prices", async () => {
    handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES(ADDRESSES));
    const log1 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);
    const log2 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("90")]);
    const log3 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [formatBytes32String("100")]);
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[0],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("108"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[0], log1.data, ...log1.topics)
      .addTraces({
        from: ADDRESSES[1],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("118"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[1], log2.data, ...log2.topics)
      .addTraces({
        from: ADDRESSES[2],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("105"), true]),
      })
      .addAnonymousEventLog(ADDRESSES[2], log3.data, ...log3.topics)
      .addTraces({
        from: ADDRESSES[3],
        input: PEEK_FUNCTION_SELECTOR,
        output: ABI.encodeFunctionResult("peek", [formatBytes32String("101"), false]),
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(ADDRESSES[0], 100, 108), createFinding(ADDRESSES[1], 90, 118)]);
  });
});
