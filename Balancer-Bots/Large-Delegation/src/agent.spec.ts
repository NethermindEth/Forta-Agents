import { ethers, Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { AgentConfig } from "./utils";

describe("Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let handleBlock: HandleBlock;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
  });
});
