import BigNumber from "bignumber.js";
import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import provideMakerStrategyHandler from "../../src/maker.strategy.cases.agent";

describe("Maker Strategy Agent Test Suit", () => {
  const web3CallMock = jest.fn();
  let handleBlock: HandleBlock;

  beforeAll(() => {
    handleBlock = provideMakerStrategyHandler(web3CallMock);
  });

  it("", () => {});
});
