import {
  Finding,
  FindingType,
  FindingSeverity,
  HandleTransaction,
  ethers,
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
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider);

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
    const from = createAddress("0x01");
    const blockTag = 1111;
    const updatedTaxFess = 300;

    const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");

    mockSigner
      .setAddress(from)
      .allowTransaction(
        from,
        TEST_REFLECT_TOKEN,
        utils.TRANSACTIONS_IFACE,
        "updateTaxFee",
        [updatedTaxFess],
        {
          confirmations: 42,
          blockTag,
          logs: [
            utils.EVENTS_IFACE.encodeEventLog(event, [previousFee, currentFee]),
          ],
        }
      );

    const contract = new ethers.Contract(
      TEST_REFLECT_TOKEN,
      utils.TRANSACTIONS_IFACE,
      mockSigner as any
    );

    const transaction = await (
      await contract.updateTaxFee(updatedTaxFess, {
        from,
      })
    ).wait();

    const findings: Finding[] = await handleTx(
      new TestTransactionEvent().addAnonymousEventLog(
        TEST_REFLECT_TOKEN,
        transaction.events[0].data,
        ...transaction.events[0].topics
      )
    );

    expect(findings).toStrictEqual(findingTestCases);
  });
});
