import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  ethers,
  TransactionEvent,
} from "forta-agent";
import agent, { GMX_ROUTER_ADDRESS } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTx } from "./agent";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { Interface } from "@ethersproject/abi";

const ABI: string[] = [
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
];

const TEST_IFACE: Interface = new Interface([
  ...ABI,
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
]);

const mockProvider: MockEthersProvider = new MockEthersProvider();
const MOCK_GMX_ROUTER_ADDRESS = "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064";
const MOCK_SWAP_EVENT =
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";
const handler = provideHandleTx(
  MOCK_GMX_ROUTER_ADDRESS,
  MOCK_SWAP_EVENT,
  mockProvider as unknown as ethers.providers.Provider
);

describe("sandwich attack frontrun agent", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  const eventFront = TEST_IFACE.getEvent("Swap");
  const logFront = TEST_IFACE.encodeEventLog(eventFront, [
    createAddress("0xf0"),
    createAddress("0xf1"),
    createAddress("0xf2"),
    50,
    50,
  ]);

  const eventVictim = TEST_IFACE.getEvent("Swap");
  const logVictim = TEST_IFACE.encodeEventLog(eventVictim, [
    createAddress("0xe0"),
    createAddress("0xf1"),
    createAddress("0xf2"),
    50,
    40,
  ]);

  const eventBack = TEST_IFACE.getEvent("Swap");
  const logBack = TEST_IFACE.encodeEventLog(eventBack, [
    createAddress("0xf0"),
    createAddress("0xf2"),
    createAddress("0xf1"),
    50,
    60,
  ]);

  const eventIrrelevant1 = TEST_IFACE.getEvent("Swap");
  const logIrrelevant1 = TEST_IFACE.encodeEventLog(eventIrrelevant1, [
    createAddress("0xaa"),
    createAddress("0xf2"),
    createAddress("0xf1"),
    20,
    20,
  ]);

  const eventIrrelevant2 = TEST_IFACE.getEvent("Swap");
  const logIrrelevant2 = TEST_IFACE.encodeEventLog(eventIrrelevant1, [
    createAddress("0xf0"),
    createAddress("0xf7"),
    createAddress("0xf8"),
    20,
    20,
  ]);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    //empty findings

    it("returns empty findings if there are no swap events to a non-router address", async () => {
      const transaction: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0x0f"))
        .setTo(createAddress("0x0f"));
      const findings = await handler(transaction);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are no swap events to a router address", async () => {
      const transaction: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0x0f"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS);
      const findings = await handler(transaction);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are swap events to a non-router address", async () => {
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(createAddress("0x0f"))
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      const findings = await handler(transaction1);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are swap events to a router address but no sandwich attack", async () => {
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(createAddress("0x0f"))
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      const findings = await handler(transaction1);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the sandwich is out of order (back-victim-front)", async () => {
      //front
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      //victim
      const transaction2: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xe0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
      //back
      const transaction3: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));

      let findings = await handler(transaction3);
      findings = await handler(transaction2);
      findings = await handler(transaction1);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the sandwich is out of order (front-back-victim)", async () => {
      //front
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      //victim
      const transaction2: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xe0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
      //back
      const transaction3: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));

      let findings = await handler(transaction1);
      findings = await handler(transaction3);
      findings = await handler(transaction2);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the sandwich is out of order (back-front-victim)", async () => {
      //front
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      //victim
      const transaction2: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xe0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
      //back
      const transaction3: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));

      let findings = await handler(transaction3);
      findings = await handler(transaction1);
      findings = await handler(transaction2);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the sandwich is out of order (victim-front-back)", async () => {
      //front
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      //victim
      const transaction2: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xe0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
      //back
      const transaction3: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));

      let findings = await handler(transaction2);
      findings = await handler(transaction1);
      findings = await handler(transaction3);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the sandwich is out of order (victim-back-front)", async () => {
      //front
      const transaction1: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
      //victim
      const transaction2: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xe0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
      //back
      const transaction3: TransactionEvent = new TestTransactionEvent()
        .setFrom(createAddress("0xf0"))
        .setTo(MOCK_GMX_ROUTER_ADDRESS)
        .setBlock(1)
        .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));

      let findings = await handler(transaction2);
      findings = await handler(transaction3);
      findings = await handler(transaction1);

      expect(findings).toStrictEqual([]);
    });
  });

  //Transaction found

  it("returns findings if there is a sandwich attack frontrun (front-victim-back)", async () => {
    //front
    const transaction1: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
    //victim
    const transaction2: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xe0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
    //back
    const transaction3: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));

    let findings = await handler(transaction1);
    findings = await handler(transaction2);
    findings = await handler(transaction3);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Sandwich Attack Frontrun",
        description: `User ${createAddress("0xe0")} suffered a sandwich attack`,
        alertId: "GMX-05",
        protocol: "GMX",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          sandwichFrontTransaction: transaction1.hash,
          victimTransaction: transaction2.hash,
          sandwichBackTransaction: transaction3.hash,
          victimAddress: createAddress("0xe0"),
          victimTokenIn: createAddress("0xf1"),
          victimTokenOut: createAddress("0xf2"),
          victimTokenInAmount: "50",
          victimTokenOutAmount: "40",
          frontrunnerAddress: createAddress("0xf0"),
          frontrunnerProfit: "10", //in terms of tokenIn
        },
      }),
    ]);
  });

  it("returns findings if there is a sandwich attack frontrun (front-victim-back) with other swaps in between from a different address trading same tokens", async () => {
    //front
    const transaction1: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
    //victim
    const transaction2: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xe0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
    //back
    const transaction3: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));
    //other swaps
    const transaction4: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xaa"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(
        eventIrrelevant1.format("sighash"),
        createAddress("0x0"),
        logIrrelevant1.data,
        ...logIrrelevant1.topics.slice(1)
      );

    let findings = await handler(transaction1);
    findings = await handler(transaction4);
    findings = await handler(transaction2);
    findings = await handler(transaction4);
    findings = await handler(transaction3);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Sandwich Attack Frontrun",
        description: `User ${createAddress("0xe0")} suffered a sandwich attack`,
        alertId: "GMX-05",
        protocol: "GMX",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          sandwichFrontTransaction: transaction1.hash,
          victimTransaction: transaction2.hash,
          sandwichBackTransaction: transaction3.hash,
          victimAddress: createAddress("0xe0"),
          victimTokenIn: createAddress("0xf1"),
          victimTokenOut: createAddress("0xf2"),
          victimTokenInAmount: "50",
          victimTokenOutAmount: "40",
          frontrunnerAddress: createAddress("0xf0"),
          frontrunnerProfit: "10", //in terms of tokenIn
        },
      }),
    ]);
  });

  it("returns findings if there is a sandwich attack frontrun (front-victim-back) with other swaps in between from the same address trading different tokens", async () => {
    //front
    const transaction1: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventFront.format("sighash"), createAddress("0x0"), logFront.data, ...logFront.topics.slice(1));
    //victim
    const transaction2: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xe0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventVictim.format("sighash"), createAddress("0x0"), logVictim.data, ...logVictim.topics.slice(1));
    //back
    const transaction3: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventBack.format("sighash"), createAddress("0x0"), logBack.data, ...logBack.topics.slice(1));
    //other swaps
    const transaction4: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(
        eventIrrelevant2.format("sighash"),
        createAddress("0x0"),
        logIrrelevant2.data,
        ...logIrrelevant2.topics.slice(1)
      );

    let findings = await handler(transaction1);
    findings = await handler(transaction4);
    findings = await handler(transaction2);
    findings = await handler(transaction4);
    findings = await handler(transaction3);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Sandwich Attack Frontrun",
        description: `User ${createAddress("0xe0")} suffered a sandwich attack`,
        alertId: "GMX-05",
        protocol: "GMX",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          sandwichFrontTransaction: transaction1.hash,
          victimTransaction: transaction2.hash,
          sandwichBackTransaction: transaction3.hash,
          victimAddress: createAddress("0xe0"),
          victimTokenIn: createAddress("0xf1"),
          victimTokenOut: createAddress("0xf2"),
          victimTokenInAmount: "50",
          victimTokenOutAmount: "40",
          frontrunnerAddress: createAddress("0xf0"),
          frontrunnerProfit: "10", //in terms of tokenIn
        },
      }),
    ]);
  });
});
