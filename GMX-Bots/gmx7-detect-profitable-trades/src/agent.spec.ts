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


  const eventGain = TEST_IFACE.getEvent("Swap");
  const logGain = TEST_IFACE.encodeEventLog(eventGain, [
    createAddress("0xf0"),
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", //USDC
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", //WBTC
    1,
    1,
  ]);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  jest.setTimeout(25000);
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
        .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));
      const findings = await handler(transaction1);

      expect(findings).toStrictEqual([]);
    });

  });

  //Transaction found

  it("returns findings if there is an account with a suspicious amount of profitable trades", async () => {
    const transaction: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));

    let findings = await handler(transaction); //for 5 grace trades
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Unusual amount of profitable trades",
        description: `User ${createAddress("0xf0").toLowerCase()} has a ${(6 / 6) * 100}% profitable trade ratio`,
        alertId: "GMX-07",
        protocol: "GMX",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          acount: createAddress("0xf0").toLowerCase(),
          profitableTrades: "6",
          totalTrades: "6",
          totalProfit: "10000000" //in USD
        },
      }),
    ]);
  });

});
