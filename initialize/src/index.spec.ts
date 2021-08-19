import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  EventType,
  getJsonRpcUrl,
  Network,
} from "forta-agent";
import agent from ".";
import Web3 from "web3";
import { abi, initialize } from "./abi";

const web3: any = new Web3(getJsonRpcUrl());

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;
  const createTxEvent = ({ gasUsed, transaction }: any) => {
    const tx = { transaction } as any;
    const receipt = { gasUsed } as any;
    const block = {} as any;
    const addresses = {} as any;
    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      addresses,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("make just one call to the contract, should return an empty array with no errors.", async () => {
      const functionSignarue = web3.eth.abi.encodeFunctionCall(initialize, []);
      console.log(functionSignarue, " asdasdasdsad");

      const txEvent = createTxEvent({
        gasUsed: "1",
        transaction: { data: functionSignarue },
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
