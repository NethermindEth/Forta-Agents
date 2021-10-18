import BigNumber from "bignumber.js";
import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import { provideMakerStrategyHandler } from "./maker.strategy.cases.agent";

describe("Maker Strategy Agent Test Suit", () => {
  let handleBlock: HandleBlock;

  beforeAll(() => {
    handleBlock = provideMakerStrategyHandler();
  });

  it("", () => {});
});
