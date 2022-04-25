import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideBigQueuedPriceDeviationHandler, { createFinding } from "./big.queued.price.deviation";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { LOG_VALUE_EVENT_SIGNATURE, PEEK_ABI, PEEK_FUNCTION_SELECTOR } from "./utils";

const ADDRESSES = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3"), createAddress("0x4")];
const CONTRACTS: Map<string, string> = new Map<string, string>([
  ["PIP_ONE", createAddress("0xa1")],
  ["PIP_TWO", createAddress("0xa2")],
  ["PIP_THREE", createAddress("0xa3")],
]);

const logIface = new utils.Interface([LOG_VALUE_EVENT_SIGNATURE]);

describe("Big deviation queued price Tests", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = {
      osmContracts: CONTRACTS,
      getOsmAddresses: jest.fn(),
      updateAddresses: jest.fn(),
    };
    handleTransaction = provideBigQueuedPriceDeviationHandler(mockFetcher);
  });

  it("should return an empty finding if there are not any traces", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the new price deviates too much", async () => {
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [107]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE"), log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(CONTRACTS.get("PIP_ONE") as string, 100, 107)]);
  });

  it("should return an empty finding if the new price doesn't deviate too much", async () => {
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [105]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE"), log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if the Peek function wasn't called from the correct contract", async () => {
    const log = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: ADDRESSES[1],
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [200]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE"), log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if Peek function wasn't called", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: CONTRACTS.get("PIP_ONE"),
      input: "0x11111111",
      output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [108]), true]),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if the Peek call wasn't successful", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: CONTRACTS.get("PIP_ONE"),
      input: PEEK_FUNCTION_SELECTOR,
      output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [108]), false]),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding if the event with deviated price was not emitted from the correct address", async () => {
    const log1 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);
    const log2 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [105])]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [108]), true]),
      })
      .addAnonymousEventLog(ADDRESSES[1], log1.data, ...log1.topics)
      .addAnonymousEventLog(ADDRESSES[0], log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple finding if there are multiple Oracles with big deviations in new prices", async () => {
    const log1 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);
    const log2 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [90])]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [108]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE"), log1.data, ...log1.topics)
      .addTraces({
        from: CONTRACTS.get("PIP_TWO"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [118]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_TWO"), log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(CONTRACTS.get("PIP_ONE") as string, 100, 108),
      createFinding(CONTRACTS.get("PIP_TWO") as string, 90, 118),
    ]);
  });

  it("should only return findings from the Oracles with big deviations on new prices", async () => {
    const log1 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);
    const log2 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [90])]);
    const log3 = logIface.encodeEventLog(logIface.getEvent("LogValue"), [defaultAbiCoder.encode(["uint256"], [100])]);
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: CONTRACTS.get("PIP_ONE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [108]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_ONE"), log1.data, ...log1.topics)
      .addTraces({
        from: CONTRACTS.get("PIP_TWO"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [118]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_TWO"), log2.data, ...log2.topics)
      .addTraces({
        from: CONTRACTS.get("PIP_TWO"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [105]), true]),
      })
      .addAnonymousEventLog(CONTRACTS.get("PIP_THREE"), log3.data, ...log3.topics)
      .addTraces({
        from: CONTRACTS.get("PIP_THREE"),
        input: PEEK_FUNCTION_SELECTOR,
        output: PEEK_ABI.encodeFunctionResult("peek", [defaultAbiCoder.encode(["uint256"], [101]), false]),
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(CONTRACTS.get("PIP_ONE") as string, 100, 108),
      createFinding(CONTRACTS.get("PIP_TWO") as string, 90, 118),
    ]);
  });
});
