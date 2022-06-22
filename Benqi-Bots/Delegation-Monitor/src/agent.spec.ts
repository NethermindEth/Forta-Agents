import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";
import util from "./utils";

const testThreshold: BigNumber = BigNumber.from(100);
const testBenqiEventIFace: Interface = new Interface([util.DELEGATE_CHANGED_EVENT]);
const testBenqiFunctionIFace: Interface = new Interface(util.BALANCE_OF_FUNCTION);
const testBenqiToken: string = createAddress("0xdef1");

const createFinding = ([delegator, fromDelegate, toDelegate, balance]: string[]) =>
  Finding.fromObject({
    name: "Large votes delegation detected",
    description: "Detect user with a huge balance delegating their votes",
    alertId: "BENQI-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      delegator,
      fromDelegate,
      toDelegate,
      balance,
    },
  });

describe("User with huge balance delegating their votes", () => {
  let handleTransaction: HandleTransaction;

  const mockProvider = new MockEthersProvider();

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(testThreshold, testBenqiToken, mockProvider as any);
    mockProvider.clear();
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const testDelegator: string = createAddress("0xabc268");
    const testFromDelegate: string = createAddress("0xabc842");
    const testToDelegate: string = createAddress("0xdef954");

    const { data, topics } = testBenqiEventIFace.encodeEventLog(testBenqiEventIFace.getEvent("DelegateChanged"), [
      testDelegator,
      testFromDelegate,
      testToDelegate,
    ]);
    mockProvider.addCallTo(testBenqiToken, 50, testBenqiFunctionIFace, "balanceOf", {
      inputs: [testDelegator],
      outputs: [100],
    });
    const badWorkSig: string = "wrong()";

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addEventLog(badWorkSig, testBenqiToken, data, ...topics.slice(1));

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings for incorrect address", async () => {
    const wrongBenqiToken: string = createAddress("0xd34d");

    const testDelegator: string = createAddress("0xabc268");
    const testFromDelegate: string = createAddress("0xabc842");
    const testToDelegate: string = createAddress("0xdef954");

    const { data, topics } = testBenqiEventIFace.encodeEventLog(testBenqiEventIFace.getEvent("DelegateChanged"), [
      testDelegator,
      testFromDelegate,
      testToDelegate,
    ]);
    mockProvider.addCallTo(wrongBenqiToken, 50, testBenqiFunctionIFace, "balanceOf", {
      inputs: [testDelegator],
      outputs: [100],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addAnonymousEventLog(wrongBenqiToken, data, ...topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should only return findings if value is equal to or greater than threshold", async () => {
    const TEST_DATA: string[][] = [
      [createAddress("0xabc238"), createAddress("0xabc872"), createAddress("0xdef914"), BigNumber.from(1).toString()],
      [createAddress("0xabc168"), createAddress("0xabc642"), createAddress("0xdef454"), BigNumber.from(100).toString()],
      [createAddress("0xabc268"), createAddress("0xabc842"), createAddress("0xdef954"), BigNumber.from(500).toString()],
    ];
    const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(50);

    for (let [delegator, fromDelegate, toDelegate, balance] of TEST_DATA) {
      const { data, topics } = testBenqiEventIFace.encodeEventLog(testBenqiEventIFace.getEvent("DelegateChanged"), [
        delegator,
        fromDelegate,
        toDelegate,
      ]);

      mockProvider.addCallTo(testBenqiToken, 50, testBenqiFunctionIFace, "balanceOf", {
        inputs: [delegator],
        outputs: [balance],
      });

      txEvent.addAnonymousEventLog(testBenqiToken, data, ...topics);
    }

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(TEST_DATA[1]), createFinding(TEST_DATA[2])]);
  });

  it("should return multiple findings", async () => {
    const TEST_DATA: string[][] = [
      [createAddress("0xabc168"), createAddress("0xabc942"), createAddress("0xdef924"), BigNumber.from(600).toString()],
      [createAddress("0xabc348"), createAddress("0xabc842"), createAddress("0xdef952"), BigNumber.from(200).toString()],
      [createAddress("0xabc248"), createAddress("0xabc812"), createAddress("0xdef952"), BigNumber.from(500).toString()],
    ];
    const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(50);

    for (let [delegator, fromDelegate, toDelegate, balance] of TEST_DATA) {
      const { data, topics } = testBenqiEventIFace.encodeEventLog(testBenqiEventIFace.getEvent("DelegateChanged"), [
        delegator,
        fromDelegate,
        toDelegate,
      ]);

      mockProvider.addCallTo(testBenqiToken, 50, testBenqiFunctionIFace, "balanceOf", {
        inputs: [delegator],
        outputs: [balance],
      });

      txEvent.addAnonymousEventLog(testBenqiToken, data, ...topics);
    }

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(TEST_DATA[0]),
      createFinding(TEST_DATA[1]),
      createFinding(TEST_DATA[2]),
    ]);
  });
});
