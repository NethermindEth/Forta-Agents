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
];

const updateTaxFee = async (
  signer: string,
  contractAddress: string,
  mockSigner: MockEthersSigner
): Promise<TestTransactionEvent> => {
  const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");

  mockSigner
    .setAddress(signer)
    .allowTransaction(
      signer,
      contractAddress,
      utils.TRANSACTIONS_IFACE,
      "updateTaxFee",
      [currentFee],
      {
        confirmations: 42,
        logs: [
          utils.EVENTS_IFACE.encodeEventLog(event, [previousFee, currentFee]),
        ],
      }
    );

  const contract = new ethers.Contract(
    contractAddress,
    utils.TRANSACTIONS_IFACE,
    mockSigner as any
  );

  const transaction = await (
    await contract.updateTaxFee(currentFee, {
      from: signer,
    })
  ).wait();

  return new TestTransactionEvent().addAnonymousEventLog(
    contractAddress,
    transaction.events[0].data,
    ...transaction.events[0].topics
  );
};

describe("Apeswap token fees updates monitor test suite", () => {
  let handleTx: HandleTransaction;
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider);

  beforeAll(() => {
    handleTx = handleTransaction(TEST_GNANA_TOKEN);
  });

  it("should ignore events emitted and functions called on another contract", async () => {
    const wrongContractAddress = createAddress("0x02");
    const from = createAddress("0x01");

    const txEvent = await updateTaxFee(from, wrongContractAddress, mockSigner);

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore wrong events emitted and functions called on the Gnana token", async () => {
    const from = createAddress("0x01");

    const txEvent = new TestTransactionEvent()
      .setFrom(from)
      .addInterfaceEventLog(
        utils.WRONG_EVENTS_IFACE.getEvent("Transfer"),
        TEST_GNANA_TOKEN,
        [from, from, 0]
      )
      .addTraces({
        input: utils.TRANSACTIONS_IFACE.encodeFunctionData("updateTaxFee", [
          currentFee,
        ]),
      });

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when updateTaxFee transaction is submitted", async () => {
    const from = createAddress("0x01");

    const txEvent = await updateTaxFee(from, TEST_GNANA_TOKEN, mockSigner);

    const findings: Finding[] = await handleTx(txEvent);

    expect(findings).toStrictEqual(findingTestCases);
  });
});
