import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  BlockEvent,
} from "forta-agent";
import agent from ".";
import Web3 from "web3";
import {
  createBlockEventWithTimestamp,
  createMocks,
  strategyParamsCollection,
  createStrategyParamWithLastReport,
} from "./tests.utils";
import { createFinding } from ".";

const strategyAddress1: string = "0x121212";
const strategyAddress2: string = "0x131313";
const vaultAddress: string = "0x141414";

describe("Yearn Finance Too much time without calling harvest agent test suite", () => {
  it("returns empty findings if haven't passed max delay since last harvest", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      strategyAddress: createStrategyParamWithLastReport(BigInt(1000000)),
    };
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      BigInt(110),
      vaultAddress,
      strategyAddress1
    );
    const handleBlock: HandleBlock = providerHandleBlock(mockWeb3, [
      strategyAddress1,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if an strategy have been too much time without harvest ", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      strategyAddress: createStrategyParamWithLastReport(BigInt(1000000)),
    };
    const mockWeb3: Web3 = createMocks(
      strategyParams,
      BigInt(90),
      vaultAddress,
      strategyAddress1
    );
    const handleBlock: HandleBlock = providerHandleBlock(mockWeb3, [
      strategyAddress1,
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(strategyAddress1)]);
  });
});
