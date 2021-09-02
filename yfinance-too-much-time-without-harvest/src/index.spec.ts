import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  BlockEvent,
} from "forta-agent";
import agent from ".";
import Web3 from "web3";
import { createBlockEventWithTimestamp, createMocks, strategyParamsCollection, createStrategyParamWithLastReport } from "./tests.utils";


const strategyAddress: string = "0x121212";
const vaultAddress: string = "0x131313";

describe("Yearn Finance Too much time without calling harvest agent test suite", () => {
  it("returns empty findings if haven't passed max delay since last harvest", async () => {
    const blockEvent: BlockEvent = createBlockEventWithTimestamp(1000100);
    const strategyParams: strategyParamsCollection = {
      strategyAddress: createStrategyParamWithLastReport(BigInt(1000000)),
    };
    const mockWeb3: Web3 = createMocks(strategyParams, BigInt(110), vaultAddress, strategyAddress);
    const handleBlock: HandleBlock = providerHandleBlock(mockWeb3, [ strategyAddress ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

});
