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
const tokenName: string = "GNANA Token";

const from = createAddress("0xcdcd");
const tAmount = ethers.utils.parseEther("1");

const previousFee = ethers.utils.parseEther("1");
const currentFee = ethers.utils.parseEther("2");

const findingTest = Finding.fromObject({
  name: "Detect Fees Related To The Token",
  description: `Fee related to the ${tokenName} token has been changed`,
  alertId: "APESWAP-3",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Apeswap",
  metadata: {
    feeType: "tax",
    previousFee: ethers.utils.formatEther(previousFee),
    currentFee: ethers.utils.formatEther(currentFee),
  },
  addresses: [],
});

describe("Apeswap token fees updates test suite", () => {
  let handleTx: HandleTransaction;
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider)
    .setAddress(from)
    .allowTransaction(
      from,
      TEST_REFLECT_TOKEN,
      utils.TRANSACTIONS_IFACE,
      "reflect",
      [tAmount],
      { confirmations: 42 } // receipt data
    );
  beforeAll(() => {
    handleTx = handleTransaction(TEST_REFLECT_TOKEN, mockSigner as any);
  });

  it("should return a finding when UpdateFees event emitted", async () => {
    const previousFee = ethers.utils.parseEther("1");
    const currentFee = ethers.utils.parseEther("2");
    const event = utils.EVENTS_IFACE.getEvent("UpdateTaxFee");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [
      previousFee,
      currentFee,
    ]);

    const txEvent: TestTransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        TEST_REFLECT_TOKEN,
        log.data,
        ...log.topics
      );

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([findingTest]);
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
    expect(findings).toStrictEqual([findingTest]);
  });

  it("should return a finding when reflect transaction is submitted", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([findingTest]);
  });
});
