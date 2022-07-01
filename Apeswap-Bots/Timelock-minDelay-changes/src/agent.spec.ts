import { Interface } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import {
  Finding,
  FindingType,
  FindingSeverity,
  HandleTransaction,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { handleTransaction } from "./agent";
import utils from "./utils";

const TEST_TIMELOCKV2SECURE: string = createAddress("0xdede");
const TEST_TIMELOCKV2GENERAL: string = createAddress("0xeded");

const WRONG_IFACE: Interface = new Interface([
  "event WrongEvent(uint256 oldDuration, uint256 newDuration)",
]);

//oldDuration, newDuration
const CASES: BigNumber[][] = [
  [BigNumber.from(2323), BigNumber.from(12323)],
  [BigNumber.from(6612323), BigNumber.from(32323)],
  [BigNumber.from(112323), BigNumber.from(212323)],
  [BigNumber.from(412323), BigNumber.from(512323)],
  [BigNumber.from(723123), BigNumber.from(823123)],
  [BigNumber.from(223123), BigNumber.from(923123)],
];

describe("Apeswap timelocks' min delay change test suite", () => {
  const handleTx: HandleTransaction = handleTransaction(
    TEST_TIMELOCKV2SECURE,
    TEST_TIMELOCKV2GENERAL
  );

  it("should ignore other event logs on TimelockV2Secure and TimelockV2General contracts", async () => {
    const event = WRONG_IFACE.getEvent("WrongEvent");
    const log = WRONG_IFACE.encodeEventLog(event, [...CASES[0]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_TIMELOCKV2SECURE, log.data, ...log.topics)
      .addAnonymousEventLog(TEST_TIMELOCKV2GENERAL, log.data, ...log.topics);

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events emitted and functions called on another contract", async () => {
    const otherContract = createAddress("0xdade");

    const event = utils.EVENT_IFACE.getEvent("MinDelayChange");
    const log = utils.EVENT_IFACE.encodeEventLog(event, [...CASES[1]]);

    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        otherContract,
        log.data,
        ...log.topics
      );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the min delay is changed on TimelockV2Secure", async () => {
    const event = utils.EVENT_IFACE.getEvent("MinDelayChange");
    const log = utils.EVENT_IFACE.encodeEventLog(event, [...CASES[2]]);

    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        TEST_TIMELOCKV2SECURE,
        log.data,
        ...log.topics
      );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Timelock - Min delay changed",
        description: `Min delay changed on Apeswap's TimelockV2Secure contract`,
        alertId: "APESWAP-11",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          oldDuration: CASES[2][0].toString(),
          newDuration: CASES[2][1].toString(),
        },
        addresses: [],
      }),
    ]);
  });

  it("should return a finding when the min delay is changed on TimelockV2General", async () => {
    const event = utils.EVENT_IFACE.getEvent("MinDelayChange");
    const log = utils.EVENT_IFACE.encodeEventLog(event, [...CASES[3]]);

    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        TEST_TIMELOCKV2GENERAL,
        log.data,
        ...log.topics
      );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Timelock - Min delay changed",
        description: `Min delay changed on Apeswap's TimelockV2General contract`,
        alertId: "APESWAP-11",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          oldDuration: CASES[3][0].toString(),
          newDuration: CASES[3][1].toString(),
        },
        addresses: [],
      }),
    ]);
  });

  it("should return multiple findings when the min delay is changed on both TimelockV2Secure and TimelockV2General", async () => {
    const event = utils.EVENT_IFACE.getEvent("MinDelayChange");
    const log1 = utils.EVENT_IFACE.encodeEventLog(event, [...CASES[4]]);
    const log2 = utils.EVENT_IFACE.encodeEventLog(event, [...CASES[5]]);

    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_TIMELOCKV2SECURE, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_TIMELOCKV2GENERAL, log2.data, ...log2.topics);

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Timelock - Min delay changed",
        description: `Min delay changed on Apeswap's TimelockV2Secure contract`,
        alertId: "APESWAP-11",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          oldDuration: CASES[4][0].toString(),
          newDuration: CASES[4][1].toString(),
        },
        addresses: [],
      }),
      Finding.fromObject({
        name: "Timelock - Min delay changed",
        description: `Min delay changed on Apeswap's TimelockV2General contract`,
        alertId: "APESWAP-11",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          oldDuration: CASES[5][0].toString(),
          newDuration: CASES[5][1].toString(),
        },
        addresses: [],
      }),
    ]);
  });
});
