import BigNumber from "bignumber.js";
import { BlockEvent, HandleBlock, Initialize, ethers, getEthersProvider, Finding } from "forta-agent";
import CONFIG from "./agent.config";
import { DECIMALS_ABI, DESCRIPTION_ABI, LATEST_ANSWER_ABI, LATEST_ROUND_DATA_ABI } from "./constants";
import {
  AgentConfig,
  createNegativeAnswerFinding,
  createPriceChangeFinding,
  ethersBnToBn,
  MonitoringInfo,
} from "./utils";

BigNumber.set({ DECIMAL_PLACES: 18 });

let tokens: MonitoringInfo[];

export const provideInitialize = (provider: ethers.providers.Provider, config: AgentConfig): Initialize => {
  return async () => {
    tokens = await Promise.all(
      config.tokens.map(async (token) => {
        const ChainlinkFeed = new ethers.Contract(
          token.chainlinkFeedAddress,
          [DECIMALS_ABI, DESCRIPTION_ABI, LATEST_ANSWER_ABI, LATEST_ROUND_DATA_ABI],
          provider
        );

        const roundData = await ChainlinkFeed.latestRoundData();
        const decimals = await ChainlinkFeed.decimals();
        const description = await ChainlinkFeed.description();

        if (roundData.answer.isNegative()) {
          throw new Error("Negative feed answer");
        }

        return {
          description,
          decimals,
          lastAnswer: ethersBnToBn(roundData.answer, decimals),
          lastTimestamp: roundData.updatedAt,
          absoluteThreshold: token.absoluteThreshold ? new BigNumber(token.absoluteThreshold) : undefined,
          ratioThreshold: token.percentageThreshold
            ? new BigNumber(token.percentageThreshold).shiftedBy(-2)
            : undefined,
          intervalSeconds: ethers.BigNumber.from(token.intervalSeconds),
          contract: ChainlinkFeed,
        };
      })
    );
  };
};

export const provideHandleBlock = (): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const timestamp = ethers.BigNumber.from(blockEvent.block.timestamp);

    await Promise.all(
      tokens.map(async (token) => {
        if (token.lastTimestamp.add(token.intervalSeconds).gt(timestamp)) {
          return;
        }

        token.lastTimestamp = timestamp;
        const latestAnswer = ethersBnToBn(await token.contract.latestAnswer(), token.decimals);

        if (latestAnswer.isNegative()) {
          findings.push(createNegativeAnswerFinding(token.description));
          return;
        }

        const diff = token.lastAnswer.minus(latestAnswer).abs();
        const ratioDiff = latestAnswer.div(token.lastAnswer).minus(1).abs();

        const isAboveAbsoluteThreshold = token.absoluteThreshold && diff.gte(token.absoluteThreshold);
        const isAbovePercentageThreshold = token.ratioThreshold && ratioDiff.gte(token.ratioThreshold);

        if (isAboveAbsoluteThreshold || isAbovePercentageThreshold) {
          findings.push(createPriceChangeFinding(token.description, latestAnswer, diff, ratioDiff.shiftedBy(2)));
        }

        token.lastAnswer = latestAnswer;
      })
    );

    return findings;
  };
};

export default {
  provideInitialize,
  initialize: provideInitialize(getEthersProvider(), CONFIG),
  provideHandleBlock,
  handleBlock: provideHandleBlock(),

  // testing
  getTokens: () => tokens,
};
