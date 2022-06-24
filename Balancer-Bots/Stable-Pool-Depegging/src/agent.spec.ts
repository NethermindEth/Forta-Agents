
import { ethers, Finding, FindingSeverity, FindingType, Initialize, HandleBlock, HandleTransaction } from "forta-agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideInitialize, provideHandleBlock, provideHandleTransaction } from "./agent";
import { AgentConfig } from "./utils";

describe("Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let initialize: Initialize;
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
  });
});
