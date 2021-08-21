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

describe("high amount of flashloans", () => {
  let handleTransaction: HandleTransaction;
  const createTxEvent = ({ gasUsed, transaction, addresses }: any) => {
    const tx = { ...transaction } as any;
    const receipt = { gasUsed } as any;
    const block = {} as any;
    const addressez = { ...addresses } as any;
    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      addressez,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    const functionSignarue = web3.eth.abi.encodeFunctionCall(initialize, []);
    it("make just one call to the contract, should return an empty array with no errors.", async () => {
      const txEvent = createTxEvent({
        gasUsed: "1",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
        },
        transaction: { data: functionSignarue },
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("second call should give a warning wiht count 2", async () => {
      const txEvent = createTxEvent({
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
        },
        gasUsed: "1",
        transaction: { data: functionSignarue },
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Initialize function",
          description: `The initialize function got called 2 times.`,
          alertId: "NETHFORTA-8",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Unknown,
          metadata: {
            count: "2",
          },
        }),
      ]);
    });

    it("third call should give a warning with count 3", async () => {
      const txEvent = createTxEvent({
        gasUsed: "1",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
        },
        transaction: { data: functionSignarue },
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Initialize function",
          description: `The initialize function got called 3 times.`,
          alertId: "NETHFORTA-8",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Unknown,
          metadata: {
            count: "3",
          },
        }),
      ]);
    });
  });
});
