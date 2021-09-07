import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import Web3 from "web3";
import {
  createBlockEventWithTimestamp,
  createMocks,
  strategyParamsCollection,
  createStrategyParamWithLastReport,
  strategyInfo,
} from "./tests.utils";
import { provideHandleBlock } from ".";
import { createFinding } from "./agent.utils";

const strategyAddress1: string = "0x6341c289b2e0795a04223df04b53a77970958723";
const strategyAddress2: string = "0xa6d1c610b3000f143c18c75d84baa0ec22681185";
const vaultAddress: string = "0xda816459f1ab5631232fe5e97a05bbbb94970c95";

describe("Yearn Finance Too much time without calling harvest agent test suite", () => {
  it("returns empty findings if haven't passed max delay since last harvest", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      [strategyAddress1]: createStrategyParamWithLastReport(BigInt(1000000)),
    };
    const strategiesInfo: strategyInfo[] = [
      {
        strategyAddress: strategyAddress1,
        maxReportDelay: BigInt(110),
      },
    ];
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      vaultAddress,
      strategiesInfo
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
    const strategiesInfo: strategyInfo[] = [
      {
        strategyAddress: strategyAddress1,
        maxReportDelay: BigInt(90),
      },
    ];
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      vaultAddress,
      strategiesInfo
    );
    const handleBlock: HandleBlock = provideHandleBlock(mockWeb3, [
      strategyAddress1,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(strategyAddress1)]);
  });

  it("returns multiple findings if there are multiple strategies affected", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      [strategyAddress1]: createStrategyParamWithLastReport(BigInt(1000000)),
      [strategyAddress2]: createStrategyParamWithLastReport(BigInt(999995)),
    };
    const strategiesInfo: strategyInfo[] = [
      {
        strategyAddress: strategyAddress1,
        maxReportDelay: BigInt(90),
      },
      {
        strategyAddress: strategyAddress2,
        maxReportDelay: BigInt(90),
      },
    ];
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      vaultAddress,
      strategiesInfo
    );
    const handleBlock: HandleBlock = provideHandleBlock(mockWeb3, [
      strategyAddress1,
      strategyAddress2,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(strategyAddress1),
      createFinding(strategyAddress2),
    ]);
  });

  it("returns only findings from strategies with problems", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      [strategyAddress1]: createStrategyParamWithLastReport(BigInt(1000000)),
      [strategyAddress2]: createStrategyParamWithLastReport(BigInt(999995)),
    };
    const strategiesInfo: strategyInfo[] = [
      {
        strategyAddress: strategyAddress1,
        maxReportDelay: BigInt(90),
      },
      {
        strategyAddress: strategyAddress2,
        maxReportDelay: BigInt(150),
      },
    ];
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      vaultAddress,
      strategiesInfo
    );
    const handleBlock: HandleBlock = provideHandleBlock(mockWeb3, [
      strategyAddress1,
      strategyAddress2,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(strategyAddress1),
    ]);
  })

  it("returns only strategies listed as interesting", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      [strategyAddress1]: createStrategyParamWithLastReport(BigInt(1000000)),
      [strategyAddress2]: createStrategyParamWithLastReport(BigInt(999995)),
    };
    const strategiesInfo: strategyInfo[] = [
      {
        strategyAddress: strategyAddress1,
        maxReportDelay: BigInt(90),
      },
      {
        strategyAddress: strategyAddress2,
        maxReportDelay: BigInt(90),
      },
    ];
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      vaultAddress,
      strategiesInfo
    );
    const handleBlock: HandleBlock = provideHandleBlock(mockWeb3, [
      strategyAddress1,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(strategyAddress1),
    ]);
  })
});
