import BigNumber from "bignumber.js";
import { ethers, HandleBlock, Initialize } from "forta-agent";
import { MockEthersProvider, TestBlockEvent, createAddress } from "forta-agent-tools/lib/tests";
import agent, { provideHandleBlock, provideInitialize } from "./agent";
import { DECIMALS_ABI, DESCRIPTION_ABI, LATEST_ANSWER_ABI, LATEST_ROUND_DATA_ABI } from "./constants";
import { createNegativeAnswerFinding, createPriceChangeFinding } from "./utils";

function mockFeedCalls(
  mockProvider: MockEthersProvider,
  feedAddress: string,
  calls: {
    description: string;
    decimals: number;
    latestAnswer: ethers.BigNumberish;
    latestTimestamp: ethers.BigNumberish;
  },
  block?: number
) {
  block = block as any as number;
  const iface = new ethers.utils.Interface([DECIMALS_ABI, DESCRIPTION_ABI, LATEST_ANSWER_ABI, LATEST_ROUND_DATA_ABI]);

  mockProvider.addCallTo(feedAddress, block, iface, "decimals", {
    inputs: [],
    outputs: [calls.decimals],
  });

  mockProvider.addCallTo(feedAddress, block, iface, "description", {
    inputs: [],
    outputs: [calls.description],
  });

  mockProvider.addCallTo(feedAddress, block, iface, "latestAnswer", {
    inputs: [],
    outputs: [ethers.BigNumber.from(calls.latestAnswer)],
  });

  mockProvider.addCallTo(feedAddress, block, iface, "latestRoundData", {
    inputs: [],
    outputs: [
      ethers.BigNumber.from(0),
      ethers.BigNumber.from(calls.latestAnswer),
      ethers.BigNumber.from(calls.latestTimestamp),
      ethers.BigNumber.from(calls.latestTimestamp),
      ethers.BigNumber.from(0),
    ],
  });
}

describe("large treasury token price change bot", () => {
  let mockProvider: MockEthersProvider = new MockEthersProvider();
  let provider: ethers.providers.Provider = mockProvider as any as ethers.providers.Provider;
  let initialize: Initialize;
  let handleBlock: HandleBlock;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as any as ethers.providers.Provider;
  });

  describe("initialize", () => {
    it("should load empty monitoring array if config.tokens is empty", async () => {
      initialize = provideInitialize(provider, { tokens: [] });

      await initialize();

      expect(agent.getTokens()).toStrictEqual([]);
    });

    it("should throw an error if the last feed answer is negative", async () => {
      const feedAddress = createAddress("0xfeed");

      mockFeedCalls(mockProvider, feedAddress, {
        description: "description",
        decimals: 18,
        latestAnswer: "-1",
        latestTimestamp: "0",
      });

      initialize = provideInitialize(provider, {
        tokens: [{ chainlinkFeedAddress: feedAddress, intervalSeconds: "3600" }],
      });

      await expect(initialize).rejects.toThrow("Negative feed answer");
      expect(agent.getTokens()).toStrictEqual([]);
    });

    it("should successfully load monitoring data using the agent config", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "0",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "0",
            percentageThreshold: "0",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      await initialize();

      const tokens = agent.getTokens();

      expect(tokens[0].description).toStrictEqual(feedCalls.description);
      expect(tokens[0].decimals).toStrictEqual(feedCalls.decimals);
      expect(tokens[0].lastTimestamp.toString()).toStrictEqual(feedCalls.latestTimestamp);
      expect(tokens[0].lastAnswer.toString(10)).toStrictEqual(feedCalls.latestAnswer);
      expect(tokens[0].absoluteThreshold?.toString(10)).toStrictEqual(agentConfig.tokens[0].absoluteThreshold);
      expect(tokens[0].ratioThreshold?.shiftedBy(2).toString(10)).toStrictEqual(
        agentConfig.tokens[0].percentageThreshold
      );
      expect(tokens[0].intervalSeconds.toString()).toStrictEqual(agentConfig.tokens[0].intervalSeconds);
    });
  });

  describe("handleBlock", () => {
    it("should return empty findings with an empty monitoring list", async () => {
      initialize = provideInitialize(provider, { tokens: [] });
      handleBlock = provideHandleBlock();

      await initialize();

      const blockEvent = new TestBlockEvent().setTimestamp(0);

      expect(agent.getTokens()).toStrictEqual([]);
      expect(await handleBlock(blockEvent)).toStrictEqual([]);
    });

    it("shouldn't make a provider call if the block's timestamp is before the monitoring timestamp", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "0",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "0",
            percentageThreshold: "0",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      const blockEvent = new TestBlockEvent().setTimestamp(1);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);
    });

    it("should make a provider call if the block's timestamp is greater than or equal to the monitoring timestamp", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "0",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            // shouldn't emit a finding since the answer doesn't change
            absoluteThreshold: "1",
            percentageThreshold: "1",
          },
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "1800",
            // shouldn't emit a finding since the answer doesn't change
            absoluteThreshold: "1",
            percentageThreshold: "1",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      const blockEvent = new TestBlockEvent().setTimestamp(3600);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length + agentConfig.tokens.length);
    });

    it("should return negative answer finding if the feed returns a negative answer", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "0",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "0",
            percentageThreshold: "0",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      mockFeedCalls(mockProvider, feedAddress, { ...feedCalls, latestAnswer: "-1" });
      const blockEvent = new TestBlockEvent().setTimestamp(3600);

      expect(await handleBlock(blockEvent)).toStrictEqual([createNegativeAnswerFinding(feedCalls.description)]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length + agentConfig.tokens.length);
    });

    it("shouldn't return a finding if the absolute price change is smaller than the absolute threshold", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "1",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "1",
            percentageThreshold: "Infinity",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      mockFeedCalls(mockProvider, feedAddress, { ...feedCalls, latestAnswer: "1" });
      const blockEvent = new TestBlockEvent().setTimestamp(3600);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length + agentConfig.tokens.length);
    });

    it("should return a finding if the absolute price change is greater than or equal to the absolute threshold", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "1",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "1e-18",
            percentageThreshold: "Infinity",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      mockFeedCalls(mockProvider, feedAddress, { ...feedCalls, latestAnswer: "2" });
      const blockEvent = new TestBlockEvent().setTimestamp(3600);

      expect(await handleBlock(blockEvent)).toStrictEqual([
        createPriceChangeFinding(
          feedCalls.description,
          new BigNumber("2").shiftedBy(-feedCalls.decimals),
          new BigNumber("2").minus(feedCalls.latestAnswer).shiftedBy(-feedCalls.decimals),
          new BigNumber("100")
        ),
      ]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length + agentConfig.tokens.length);
    });

    it("shouldn't return a finding if the relative price change is smaller than the percentage threshold", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "1",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "1",
            percentageThreshold: "100.1",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      mockFeedCalls(mockProvider, feedAddress, { ...feedCalls, latestAnswer: "2" });
      const blockEvent = new TestBlockEvent().setTimestamp(3600);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length + agentConfig.tokens.length);
    });

    it("should return a finding if the relative price change is greater than or equal to the percentage threshold", async () => {
      const feedAddress = createAddress("0xfeed");
      const feedCalls = {
        description: "description",
        decimals: 18,
        latestAnswer: "1",
        latestTimestamp: "0",
      };
      const agentConfig = {
        tokens: [
          {
            chainlinkFeedAddress: feedAddress,
            intervalSeconds: "3600",
            absoluteThreshold: "1",
            percentageThreshold: "99.9",
          },
        ],
      };

      mockFeedCalls(mockProvider, feedAddress, feedCalls);

      initialize = provideInitialize(provider, agentConfig);
      handleBlock = provideHandleBlock();

      await initialize();
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length);

      mockFeedCalls(mockProvider, feedAddress, { ...feedCalls, latestAnswer: "2" });
      const blockEvent = new TestBlockEvent().setTimestamp(3600);

      expect(await handleBlock(blockEvent)).toStrictEqual([
        createPriceChangeFinding(
          feedCalls.description,
          new BigNumber("2").shiftedBy(-feedCalls.decimals),
          new BigNumber("2").minus(feedCalls.latestAnswer).shiftedBy(-feedCalls.decimals),
          new BigNumber("100")
        ),
      ]);
      expect(mockProvider.call).toHaveBeenCalledTimes(3 * agentConfig.tokens.length + agentConfig.tokens.length);
    });
  });
});
