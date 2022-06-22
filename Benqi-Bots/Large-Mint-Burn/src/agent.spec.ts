import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { EVENTS_SIGNATURES } from "./utils";

// function to generate test findings
const createFinding = (name: string, args: any[]) => {
  let finding;
  name == "Mint"
    ? (finding = Finding.fromObject({
        name: `Large ${name} on PGL contract`,
        description: `${name} event was emitted in PGL Contract with large tokens amount`,
        alertId: "BENQI-8-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          sender: args[0].toLowerCase(),
          amount0: args[1].toString(),
          amount1: args[2].toString(),
        },
      }))
    : (finding = Finding.fromObject({
        name: `Large ${name} on PGL contract`,
        description: `${name} event was emitted in PGL Contract with large tokens amount`,
        alertId: "BENQI-8-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Benqi Finance",
        metadata: {
          sender: args[0].toLowerCase(),
          amount0: args[1].toString(),
          amount1: args[2].toString(),
          to: args[3].toLowerCase(),
        },
      }));
  return finding;
};
// const used for tests
const TEST_PGL_CONTRACT = createAddress("0xa1");
const PGL_IFACE = new Interface(EVENTS_SIGNATURES);
const DIFFERENT_CONTRACT = createAddress("0xff");
const IRRELEVANT_IFACE = new Interface(["event irrelevant1()", "event irrelevant2()"]);

// Data used in different tests
const TEST_DATA = [
  [createAddress("0xb1"), BigNumber.from(80), BigNumber.from(150)], // Mint event with regular amounts
  [createAddress("0xb2"), BigNumber.from(120), BigNumber.from(30)], // Mint event with large QI amount
  [createAddress("0xb2"), BigNumber.from(50), BigNumber.from(210)], // Mint event with large WAVAX amount
  [createAddress("0xb2"), BigNumber.from(140), BigNumber.from(250)], // Mint event with large QI and WAVAX amounts
  [createAddress("0xb3"), BigNumber.from(80), BigNumber.from(150), createAddress("0xc1")], // Burn event with regular amounts
  [createAddress("0xb4"), BigNumber.from(110), BigNumber.from(130), createAddress("0xc2")], // Burn event with large QI amount
  [createAddress("0xb4"), BigNumber.from(30), BigNumber.from(210), createAddress("0xc2")], // Burn event with large WAVAX amount

  [createAddress("0xb3"), BigNumber.from(150), BigNumber.from(250), createAddress("0xc1")], // Burn event with large QI and WAVAX amounts
];

describe("Large PGL Burn-Mint agent tests suite", () => {
  // mock Fetcher
  const mockGetReserves = jest.fn();
  const mockFetcher = {
    pglAddress: TEST_PGL_CONTRACT,
    getReserves: mockGetReserves,
  };

  // init the agent
  const handler = provideHandleTransaction(10, mockFetcher as any);

  beforeEach(() => {
    mockFetcher.getReserves.mockClear();
    // set the reserves used in tests
    mockFetcher.getReserves.mockResolvedValue([BigNumber.from(1000), BigNumber.from(2000)]);
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on PGL contract", async () => {
    const log1 = IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("irrelevant1"), []);
    const log2 = IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("irrelevant2"), []);
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Burn/Mint events on a different contract", async () => {
    const log1 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Burn"), TEST_DATA[5]);
    const log2 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Mint"), TEST_DATA[1]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(DIFFERENT_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(DIFFERENT_CONTRACT, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Burn/Mint events with regular amounts on PGL contract", async () => {
    const log1 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Burn"), TEST_DATA[4]);
    const log2 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Mint"), TEST_DATA[0]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when QI amount is above the threshold", async () => {
    // Burn event with large QI amount
    const log1 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Burn"), TEST_DATA[5]);
    // Mint event with large QI amount
    const log2 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Mint"), TEST_DATA[1]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([createFinding("Burn", TEST_DATA[5]), createFinding("Mint", TEST_DATA[1])]);
  });

  it("should return a finding when WAVAX amount is above the threshold", async () => {
    // Burn event with large WAVAX amount
    const log1 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Burn"), TEST_DATA[6]);
    // Mint event with large WAVAX amount
    const log2 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Mint"), TEST_DATA[2]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([createFinding("Burn", TEST_DATA[6]), createFinding("Mint", TEST_DATA[2])]);
  });

  it("should return multiple findings", async () => {
    // Burn event with large QI and WAVAX amounts
    const log1 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Burn"), TEST_DATA[7]);
    // Mint event with large QI amount
    const log2 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Mint"), TEST_DATA[1]);
    // Mint event with regular amounts
    const log3 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Mint"), TEST_DATA[0]);
    // Burn event with large WAVAX amount
    const log4 = PGL_IFACE.encodeEventLog(PGL_IFACE.getEvent("Burn"), TEST_DATA[6]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log3.data, ...log3.topics)
      .addAnonymousEventLog(TEST_PGL_CONTRACT, log4.data, ...log4.topics);

    const findings: Finding[] = await handler(txEvent);
    expect(findings).toStrictEqual([
      createFinding("Burn", TEST_DATA[7]),
      createFinding("Mint", TEST_DATA[1]),
      createFinding("Burn", TEST_DATA[6]),
    ]);
  });
});
