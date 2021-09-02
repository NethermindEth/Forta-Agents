import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import Web3 from "web3";
import {
  createBlockEventWithTimestamp,
  createMocks,
  strategyParamsCollection,
  createStrategyParamWithLastReport,
} from "./tests.utils";
import { provideHandleBlock } from ".";
import { createFinding } from "./agent.utils";

const strategyAddress1: string = "0x6341c289b2e0795a04223df04b53a77970958723";
const strategyAddress2: string = "0x3280499298ace3fd3cd9c2558e9e8746ace3e52d";
const vaultAddress: string = "0xda816459f1ab5631232fe5e97a05bbbb94970c95";

describe("Yearn Finance Too much time without calling harvest agent test suite", () => {
  it("returns empty findings if haven't passed max delay since last harvest", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      [strategyAddress1]: createStrategyParamWithLastReport(BigInt(1000000)),
    };
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      BigInt(110),
      vaultAddress,
      strategyAddress1
    );
    const handleBlock: HandleBlock = provideHandleBlock(mockWeb3, [
      strategyAddress1,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if an strategy have been too much time without harvest ", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      [strategyAddress1]: createStrategyParamWithLastReport(BigInt(1000000)),
    };
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      BigInt(90),
      vaultAddress,
      strategyAddress1
    );
    const handleBlock: HandleBlock = provideHandleBlock(mockWeb3, [
      strategyAddress1,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(strategyAddress1)]);
  });
});
