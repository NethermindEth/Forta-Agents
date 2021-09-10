import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent, { web3, killme } from "./killme";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEventWithGasUsed = (gasUsed: string) =>
    createTransactionEvent({
      transaction: {} as any,
      receipt: { gasUsed } as any,
      block: {} as any,
    });

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("create and send a tx with the tx event", () => {
    web3.eth.abi.encodeFunctionCall(killme as any, []);
  });
});
