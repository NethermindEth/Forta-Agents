import { ethers } from "ethers";
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

const TEST_REFLECT_TOKEN: string = createAddress("0xcdcd");

const previousFee = "1";
const currentFee = "2";

const findingTestCases = [
  Finding.fromObject({
    name: "Detect Fees Related To The Token",
    description: `token tax fee has been changed`,
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
];

describe("Apeswap token fees updates test suite", () => {
  let handleTx: HandleTransaction;

  beforeAll(() => {
    handleTx = handleTransaction(TEST_REFLECT_TOKEN);
  });

  it("should not return a finding when wrong event is emitted", async () => {
    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(TEST_REFLECT_TOKEN);

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when UpdateFees event emitted", async () => {
    const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");

    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addInterfaceEventLog(
        event,
        TEST_REFLECT_TOKEN,
        [previousFee, currentFee]
      );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual(findingTestCases);
  });
});
