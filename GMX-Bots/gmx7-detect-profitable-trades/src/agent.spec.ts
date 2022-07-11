import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  Initialize,
  createTransactionEvent,
  ethers,
  getEthersProvider,
  TransactionEvent,
} from "forta-agent";
import agent, { GMX_ROUTER_ADDRESS } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTx, initialize } from "./agent";
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
let mockPriceFeed = {
  get: jest.fn().mockReturnValue({latestRoundData: jest.fn().mockReturnValue({
    roundId: 0,
    answer: 1,
    startedAt: 2,
    updatedAt: 3,
    answeredInRound: 4,
  })})
  }
  
const handler = provideHandleTx(
  MOCK_GMX_ROUTER_ADDRESS,
  MOCK_SWAP_EVENT,
  mockProvider as unknown as ethers.providers.Provider,
  mockPriceFeed as unknown as Map<string, ethers.Contract>
);
const provider = getEthersProvider();
const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];
const priceFeedData1 = {
  wethPriceFeed: new ethers.Contract("0x639fe6ab55c921f74e7fac1ee960c0b6293ba612", aggregatorV3InterfaceABI, provider),
  wbtcPriceFeed: new ethers.Contract("0x6ce185860a4963106506c203335a2910413708e9", aggregatorV3InterfaceABI, provider),
  linkPriceFeed: new ethers.Contract("0x86e53cf1b870786351da77a57575e79cb55812cb", aggregatorV3InterfaceABI, provider),
  uniPriceFeed: new ethers.Contract("0x9c917083fdb403ab5adbec26ee294f6ecada2720", aggregatorV3InterfaceABI, provider),
  usdcPriceFeed: new ethers.Contract("0x50834f3163758fcc1df9973b6e91f0f0f0434ad3", aggregatorV3InterfaceABI, provider),
  usdtPriceFeed: new ethers.Contract("0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7", aggregatorV3InterfaceABI, provider),
  daiPriceFeed: new ethers.Contract("0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb", aggregatorV3InterfaceABI, provider),
  fraxPriceFeed: new ethers.Contract("0x0809e3d38d1b4214958faf06d8b1b1a2b73f2ab8", aggregatorV3InterfaceABI, provider),
  mimPriceFeed: new ethers.Contract("0x87121f6c9a9f6e90e59591e4cf4804873f54a95b", aggregatorV3InterfaceABI, provider)
  };
const init = initialize(priceFeedData1);

describe("sandwich attack frontrun agent", () => {
  let handleTransaction: HandleTransaction;
  let initialize: Initialize;
  const mockTxEvent = createTransactionEvent({} as any);


  const eventGain = TEST_IFACE.getEvent("Swap");
  const logGain = TEST_IFACE.encodeEventLog(eventGain, [
    createAddress("0xf0"),
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", //USDC
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", //WBTC
    1,
    1,
  ]);

  beforeAll(async () => {
    handleTransaction = agent.handleTransaction;
    await init(); //run initialize before the tests
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

      mockPriceFeed.get().latestRoundData.mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      }).mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      });
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
          account: createAddress("0xf0").toLowerCase(),
          profitableTrades: "6",
          totalTrades: "6",
          totalProfit: "119994" //in USD
        },
      }),
    ]);
  });

});
