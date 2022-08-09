import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { provideBotHandler } from "./agent";
import { encodeParameter } from "forta-agent-tools/lib/utils";
import { TestTransactionEvent, createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { getPancakePairCreate2Address } from "./utils";
import { ERC20ABI, PANCAKE_PAIR_ABI } from "./constants";
import { BigNumber } from "ethers";
import DataFetcher from "./data.fetcher";

const createFinding = (
  pairAddress: string,
  swapTokenIn: string,
  swapTokenOut: string,
  swapAmountIn: BigNumber,
  swapAmountOut: BigNumber,
  percentageTokenIn: BigNumber,
  percentageTokenOut: BigNumber,
  swap_recipient: string
): Finding => {
  return Finding.from({
    name: "Large swap",
    description: "A swap that involved a significant percentage of a pool's liquidity was detected",
    alertId: "CAKE-2",
    protocol: "PancakeSwap",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pancakePair: pairAddress,
      tokenIn: swapTokenIn,
      tokenOut: swapTokenOut,
      amountIn: swapAmountIn.toString(),
      amountOut: swapAmountOut.toString(),
      percentageIn: percentageTokenIn.toString(),
      percentageOut: percentageTokenOut.toString(),
      swapRecipient: swap_recipient,
    },
  });
};

const PAIR_IFACE = new ethers.utils.Interface(PANCAKE_PAIR_ABI);
const TOKEN_IFACE = new ethers.utils.Interface(ERC20ABI);
const TEST_PANCAKE_FACTORY = createAddress("0x32");
const [token0, token1, token2, token3] = [
  createAddress("0x01"),
  createAddress("0x02"),
  createAddress("0x03"),
  createAddress("0x04"),
];
const INIT_CODE = ethers.utils.keccak256("0x");
const TEST_PAIR_ADDRESS = getPancakePairCreate2Address(TEST_PANCAKE_FACTORY, token0, token1, INIT_CODE).toLowerCase();
const TEST_PAIR_ADDRESS2 = getPancakePairCreate2Address(TEST_PANCAKE_FACTORY, token2, token3, INIT_CODE).toLowerCase();
const TEST_LARGE_THRESHOLD = BigNumber.from("10"); // percent
export const SWAP_EVENT =
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out,uint amount1Out,address indexed to)";
const SENDER = createAddress("0x12");

const toEbn = (num: string) => ethers.BigNumber.from(num);

const createSwapEvent = (
  pairAddress: string,
  amount0In: ethers.BigNumber,
  amount1In: ethers.BigNumber,
  amount0Out: ethers.BigNumber,
  amount1Out: ethers.BigNumber,
  to: string
): [string, string, string, string, string] => {
  const data = ethers.utils.defaultAbiCoder.encode(
    ["uint", "uint", "uint", "uint"],
    [amount0In, amount1In, amount0Out, amount1Out]
  );
  const senderTopic = encodeParameter("address", SENDER);
  const toTopic = encodeParameter("address", to);
  return ["Swap(address,uint256,uint256,uint256,uint256,address)", pairAddress, data, senderTopic, toTopic];
};

const createSomeOtherEvent = (contractAddress: string, arg1: string): [string, string, string] => {
  const data: string = encodeParameter("uint256", arg1);
  return ["SomeOtherEvent(uint256)", contractAddress, data];
};

describe("PancakeSwap Large Swap Bot Test Suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockFetcher: DataFetcher = new DataFetcher(mockProvider as any);
  const handleTransaction: HandleTransaction = provideBotHandler(
    TEST_LARGE_THRESHOLD,
    TEST_PANCAKE_FACTORY,
    mockFetcher,
    INIT_CODE
  );

  const setBalanceOf = (block: number, tokenAddress: string, account: string, balance: ethers.BigNumber) => {
    mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "balanceOf", {
      inputs: [account],
      outputs: [balance],
    });
  };

  const setTokenPair = (block: number, pairAddress: string, tokenAddress: string, functionId: "token0" | "token1") => {
    mockProvider.addCallTo(pairAddress, block, PAIR_IFACE, functionId, {
      inputs: [],
      outputs: [tokenAddress],
    });
  };

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return empty findings with empty transaction", async () => {
    const txEvent = new TestTransactionEvent();
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return empty findings when other events are emitted from the contract", async () => {
    const txEvent = new TestTransactionEvent().addEventLog(...createSomeOtherEvent(TEST_PAIR_ADDRESS, "10"));
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return empty findings when target event is emitted from contracts that are not valid pancake pairs", async () => {
    const swapEventLog = createSwapEvent(
      createAddress("0x89"), // not a valid pair
      toEbn("0"),
      toEbn("200"),
      toEbn("100"),
      toEbn("0"),
      createAddress("0x1")
    );
    const txEvent = new TestTransactionEvent().setBlock(1000).addEventLog(...swapEventLog);
    setTokenPair(1000, createAddress("0x89"), token0, "token0");
    setTokenPair(1000, createAddress("0x89"), token1, "token1");
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return empty findings for swaps that are not large", async () => {
    const swapEventLog = createSwapEvent(
      TEST_PAIR_ADDRESS,
      toEbn("0"),
      toEbn("200"),
      toEbn("100"),
      toEbn("0"),
      createAddress("0x1")
    );
    const txEvent = new TestTransactionEvent().setBlock(101).addEventLog(...swapEventLog);
    setTokenPair(101, TEST_PAIR_ADDRESS, token0, "token0");
    setTokenPair(101, TEST_PAIR_ADDRESS, token1, "token1");
    setBalanceOf(100, token0, TEST_PAIR_ADDRESS, toEbn("2000")); // swap not large
    setBalanceOf(100, token1, TEST_PAIR_ADDRESS, toEbn("4000")); // swap not large
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return findings for swaps that are large and from a valid pancake pair", async () => {
    const swapEventLog = createSwapEvent(
      TEST_PAIR_ADDRESS,
      toEbn("0"),
      toEbn("200"),
      toEbn("100"),
      toEbn("0"),
      createAddress("0x9")
    );
    const txEvent = new TestTransactionEvent().setBlock(210).addEventLog(...swapEventLog);
    setTokenPair(210, TEST_PAIR_ADDRESS, token0, "token0");
    setTokenPair(210, TEST_PAIR_ADDRESS, token1, "token1");
    setBalanceOf(209, token0, TEST_PAIR_ADDRESS, toEbn("900")); // swap is large relative to pair's token balance
    setBalanceOf(209, token1, TEST_PAIR_ADDRESS, toEbn("1800"));
    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        TEST_PAIR_ADDRESS,
        token1,
        token0,
        toEbn("200"),
        toEbn("100"),
        toEbn("200").mul(100).div(1800),
        toEbn("100").mul(100).div(900),
        createAddress("0x9")
      ),
    ]);
  });

  it("should return multiple findings when both amount0 and amount1 are large.", async () => {
    const swapEventLog = createSwapEvent(
      TEST_PAIR_ADDRESS,
      toEbn("4000"),
      toEbn("1500"),
      toEbn("3000"),
      toEbn("2000"),
      createAddress("0x9")
    );
    const notLargeSwapEventLog = createSwapEvent(
      TEST_PAIR_ADDRESS,
      toEbn("1000"),
      toEbn("1100"),
      toEbn("500"),
      toEbn("800"),
      createAddress("0x9")
    ); // should ignore
    const txEvent = new TestTransactionEvent()
      .setBlock(310)
      .addEventLog(...swapEventLog)
      .addEventLog(...notLargeSwapEventLog);
    setTokenPair(310, TEST_PAIR_ADDRESS, token0, "token0");
    setTokenPair(310, TEST_PAIR_ADDRESS, token1, "token1");
    setBalanceOf(309, token0, TEST_PAIR_ADDRESS, toEbn("25000")); // swap is large relative to pair's token balance
    setBalanceOf(309, token1, TEST_PAIR_ADDRESS, toEbn("12500"));
    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        TEST_PAIR_ADDRESS,
        token1,
        token0,
        toEbn("1500"),
        toEbn("3000"),
        toEbn("1500").mul(100).div(12500),
        toEbn("3000").mul(100).div(25000),
        createAddress("0x9")
      ),

      createFinding(
        TEST_PAIR_ADDRESS,
        token0,
        token1,
        toEbn("4000"),
        toEbn("2000"),
        toEbn("4000").mul(100).div(25000),
        toEbn("2000").mul(100).div(12500),
        createAddress("0x9")
      ),
    ]);
  });

  it("should return multiple findings correctly when there are multiple events with large swaps.", async () => {
    const swapEventLog = createSwapEvent(
      TEST_PAIR_ADDRESS,
      toEbn("0"),
      toEbn("1500"),
      toEbn("3000"),
      toEbn("0"),
      createAddress("0x9")
    );
    const swapEventLog2 = createSwapEvent(
      TEST_PAIR_ADDRESS2,
      toEbn("2000"),
      toEbn("0"),
      toEbn("0"),
      toEbn("5050"),
      createAddress("0x8")
    );
    const swapEventLog3 = createSwapEvent(
      createAddress("0x99"), // not a valid pair
      toEbn("2000"),
      toEbn("0"),
      toEbn("0"),
      toEbn("5050"),
      createAddress("0x8")
    );
    const txEvent = new TestTransactionEvent()
      .setBlock(15)
      .addEventLog(...swapEventLog)
      .addEventLog(...swapEventLog2)
      .addEventLog(...swapEventLog3);
    setTokenPair(15, TEST_PAIR_ADDRESS, token0, "token0");
    setTokenPair(15, TEST_PAIR_ADDRESS, token1, "token1");
    setTokenPair(15, TEST_PAIR_ADDRESS2, token2, "token0");
    setTokenPair(15, TEST_PAIR_ADDRESS2, token3, "token1");
    setTokenPair(15, createAddress("0x99"), token2, "token0");
    setTokenPair(15, createAddress("0x99"), token3, "token1");
    setBalanceOf(14, token0, TEST_PAIR_ADDRESS, toEbn("25000")); // swap is large relative to pair's token balance
    setBalanceOf(14, token1, TEST_PAIR_ADDRESS, toEbn("12500"));
    setBalanceOf(14, token2, TEST_PAIR_ADDRESS2, toEbn("20000"));
    setBalanceOf(14, token3, TEST_PAIR_ADDRESS2, toEbn("50000"));
    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        TEST_PAIR_ADDRESS,
        token1,
        token0,
        toEbn("1500"),
        toEbn("3000"),
        toEbn("1500").mul(100).div(12500),
        toEbn("3000").mul(100).div(25000),
        createAddress("0x9")
      ),

      createFinding(
        TEST_PAIR_ADDRESS2,
        token2,
        token3,
        toEbn("2000"),
        toEbn("5050"),
        toEbn("2000").mul(100).div(20000),
        toEbn("5050").mul(100).div(50000),
        createAddress("0x8")
      ),
    ]);
  });
});
