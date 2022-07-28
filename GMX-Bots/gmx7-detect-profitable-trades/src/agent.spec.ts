import { FindingType, FindingSeverity, Finding, ethers, getEthersProvider, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTx, initialize } from "./agent";
import { createAddress } from "forta-agent-tools/lib/tests";
import { Interface } from "@ethersproject/abi";

const ABI: string[] = [
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
];

const TEST_IFACE: Interface = new Interface(ABI);

const MOCK_GMX_ROUTER_ADDRESS = "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064";
const MOCK_NETWORK_MANAGER = {
  get: jest.fn().mockReturnValue(MOCK_GMX_ROUTER_ADDRESS),
};
const MOCK_SWAP_EVENT =
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";
let mockPriceFeed = {
  get: jest.fn().mockReturnValue({
    latestRoundData: jest.fn().mockReturnValue({
      roundId: 0,
      answer: 1,
      startedAt: 2,
      updatedAt: 3,
      answeredInRound: 4,
    }),
  }),
};

const handler = provideHandleTx(
  MOCK_NETWORK_MANAGER,
  MOCK_SWAP_EVENT,
  mockPriceFeed as unknown as Map<string, ethers.Contract>
);

describe("sandwich attack frontrun agent", () => {
  const eventGain = TEST_IFACE.getEvent("Swap");
  const logGain = TEST_IFACE.encodeEventLog(eventGain, [
    createAddress("0xf0"),
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", //USDC
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", //WBTC
    1,
    1,
  ]);

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

  it("returns empty findings if there is an account with a suspicious amount of profitable trades but not above the grace period", async () => {
    const transaction: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));

    mockPriceFeed
      .get()
      .latestRoundData.mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      });
    let findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if there is an account with a amount of trades larger than the grace period but not enough are profitable to be suspicious", async () => {
    const transaction: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));

    mockPriceFeed
      .get()
      .latestRoundData.mockReturnValueOnce({
        roundId: 0,
        answer: 2100000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      });
    let findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);

    expect(findings).toStrictEqual([]);
  });

  //Transaction found

  it("returns findings if there is an account with a suspicious amount of profitable trades", async () => {
    const transaction: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));

    mockPriceFeed
      .get()
      .latestRoundData.mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      });
    let findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);
    findings = await handler(transaction);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Unusual amount of profitable trades",
        description: `User ${createAddress("0xf0").toLowerCase()} has a ${(15 / 16) * 100}% profitable trade ratio`,
        alertId: "GMX-07",
        protocol: "GMX",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          account: createAddress("0xf0").toLowerCase(),
          profitableTrades: "15",
          totalTrades: "16",
          totalProfit: "298985", //in USD
        },
      }),
    ]);
  });

  it("returns findings if there is still a suspicious amount of profitable trades", async () => {
    const transaction: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));

    mockPriceFeed
      .get()
      .latestRoundData.mockReturnValueOnce({
        roundId: 0,
        answer: 100000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      });
    let findings = await handler(transaction);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Unusual amount of profitable trades",
        description: `User ${createAddress("0xf0").toLowerCase()} has a ${(16 / 17) * 100}% profitable trade ratio`,
        alertId: "GMX-07",
        protocol: "GMX",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          account: createAddress("0xf0").toLowerCase(),
          profitableTrades: "16",
          totalTrades: "17",
          totalProfit: "318984", //in USD
        },
      }),
    ]);
  });

  //empty findings (again)

  it("returns empty findings if the amount of profitable trades is no longer suspicious", async () => {
    const transaction: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xf0"))
      .setTo(MOCK_GMX_ROUTER_ADDRESS)
      .setBlock(1)
      .addEventLog(eventGain.format("sighash"), createAddress("0x0"), logGain.data, ...logGain.topics.slice(1));

    mockPriceFeed
      .get()
      .latestRoundData.mockReturnValueOnce({
        roundId: 0,
        answer: 2100000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      })
      .mockReturnValueOnce({
        roundId: 0,
        answer: 2000000000000,
        startedAt: 2,
        updatedAt: 3,
        answeredInRound: 4,
      });
    let findings = await handler(transaction);

    expect(findings).toStrictEqual([]);
  });
});
