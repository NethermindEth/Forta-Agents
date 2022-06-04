import { TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import { HandleBlock, HandleTransaction } from "forta-agent";

import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import agent, { provideHandleTransaction } from "./agent";
import CONFIG from "./agent.config";
import utils from "./utils";

describe("Bad debt after market  interaction tests suit", () => {
  let handleTx: HandleTransaction;
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  beforeEach(() => {
    handleTx = agent.handleTransaction;
  });
});
