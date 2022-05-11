import { Finding, HandleTransaction, ethers } from "forta-agent";
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

const testFees = [
  { previousFee: "1", currentFee: "2" },
  { previousFee: "4", currentFee: "3" },
  { previousFee: "5", currentFee: "6" },
];

const findingTestCases = [
  utils.createFinding(testFees[0]),
  utils.createFinding(testFees[1]),
];

describe("Apeswap token fees updates monitor test suite", () => {
  let handleTx: HandleTransaction;

  beforeAll(() => {
    handleTx = handleTransaction(TEST_GNANA_TOKEN);
  });

  it("should ignore events emitted on another contract", async () => {
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

  it("should ignore wrong events emitted on the Gnana token", async () => {
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

  it("should return a finding when UpdateTaxFee event is emitted", async () => {
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

  it("should return two findings when the owner updates the tax fees twice in the same transaction", async () => {
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
