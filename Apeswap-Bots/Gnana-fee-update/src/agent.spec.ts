import {
  Finding,
  FindingType,
  FindingSeverity,
  HandleTransaction,
  ethers,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { handleTransaction } from "./agent";
import utils from "./utils";

const WRONG_EVENT_ABI: string[] = [
  "event Transfer(address indexed from,address indexed to,uint256 value)",
];

const WRONG_EVENTS_IFACE: ethers.utils.Interface = new ethers.utils.Interface(
  WRONG_EVENT_ABI
);

const TEST_GNANA_TOKEN: string = createAddress("0xcdcd");

const previousFee = "1";
const currentFee = "2";

const findingTestCases = [
  Finding.fromObject({
    name: "Detect Fees Related To The Token",
    description: "Token tax fee has been changed",
    alertId: "APESWAP-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      previousFee: previousFee,
      currentFee: currentFee,
    },
    addresses: [],
  }),
  Finding.fromObject({
    name: "Detect Fees Related To The Token",
    description: "Token tax fee has been changed",
    alertId: "APESWAP-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      previousFee: currentFee,
      currentFee: previousFee,
    },
    addresses: [],
  }),
];

describe("Apeswap token fees updates monitor test suite", () => {
  let handleTx: HandleTransaction;

  beforeAll(() => {
    handleTx = handleTransaction(TEST_GNANA_TOKEN);
  });

  it("should ignore events emitted and functions called on another contract", async () => {
    const wrongContractAddress = createAddress("0x02");
    const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [
      previousFee,
      currentFee,
    ]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      wrongContractAddress,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore wrong events emitted and functions called on the Gnana token", async () => {
    const event = WRONG_EVENTS_IFACE.getEvent("Transfer");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [
      createAddress("0x1"),
      createAddress("0x2"),
      1,
    ]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      TEST_GNANA_TOKEN,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when updateTaxFee transaction is submitted", async () => {
    const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [
      previousFee,
      currentFee,
    ]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      TEST_GNANA_TOKEN,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTx(txEvent);

    expect(findings).toStrictEqual([findingTestCases[0]]);
  });

  it("should return two finding when the owner updates the tax fees and then decide to submit the transaction again to reuse the old tax value", async () => {
    const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");
    const log1 = utils.EVENTS_IFACE.encodeEventLog(event, [
      previousFee,
      currentFee,
    ]);
    const log2 = utils.EVENTS_IFACE.encodeEventLog(event, [
      currentFee,
      previousFee,
    ]);

    const txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_GNANA_TOKEN, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_GNANA_TOKEN, log2.data, ...log2.topics);

    const findings: Finding[] = await handleTx(txEvent);

    expect(findings).toStrictEqual(findingTestCases);
  });
});
