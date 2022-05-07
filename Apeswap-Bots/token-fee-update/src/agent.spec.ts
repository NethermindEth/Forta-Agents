import { Interface } from "ethers/lib/utils";
import { BigNumber, ethers } from "ethers";
import {
  Finding,
  FindingType,
  FindingSeverity,
  HandleTransaction,
} from "forta-agent";
import {
  createAddress,
  MockEthersProvider,
  MockEthersSigner,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { handleTransaction } from "./agent";
import utils from "./utils";

const TEST_REFLECT_TOKEN: string = createAddress("0xcdcd");

const from = createAddress("0xcdcd");
const tAmount = ethers.utils.parseEther("1");

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
      feeType: "tax",
      previousFee: previousFee,
      currentFee: currentFee,
    },
    addresses: [],
  }),
  Finding.fromObject({
    name: "Detect Fees Related To The Token",
    description: `token reflect fee has been changed`,
    alertId: "APESWAP-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      feeType: "reflect",
      previousFee: tAmount.toString(),
      currentFee: tAmount.toString(),
    },
    addresses: [],
  }),
];

describe("Apeswap token fees updates test suite", () => {
  let handleTx: HandleTransaction;
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider);

  beforeAll(() => {
    handleTx = handleTransaction(TEST_REFLECT_TOKEN, mockSigner as any);
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
    expect(findings).toStrictEqual([findingTestCases[0]]);
  });

  it("should return a finding when transfer event is emitted", async () => {
    const event = utils.EVENTS_IFACE.getEvent("Transfer");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [
      from,
      TEST_REFLECT_TOKEN,
      tAmount,
    ]);

    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        TEST_REFLECT_TOKEN,
        log.data,
        ...log.topics
      );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([findingTestCases[1]]);
  });

  it("should return a finding when reflect transaction is submitted", async () => {
    const blockTag = 1111;
    const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(
      blockTag
    );

    mockSigner.setAddress(from).allowTransaction(
      from,
      TEST_REFLECT_TOKEN,
      utils.TRANSACTIONS_IFACE,
      "reflect",
      [tAmount],
      { confirmations: 42, blockTag } // receipt data
    );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([findingTestCases[1]]);
  });
});
