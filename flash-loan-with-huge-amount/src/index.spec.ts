import {
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
  HandleTransaction,
  Network,
  TransactionEvent,
} from "forta-agent";
import agent from ".";

import Web3 from "web3";
const web3 = new Web3(getJsonRpcUrl());

describe("flash loan agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEvent = ({ gasUsed, addresses, logs, blockNumber }: any) => {
    const tx = {} as any;
    const receipt = { gasUsed, logs } as any;
    const block = { number: blockNumber } as any;
    const addressez = { ...addresses } as any;
    return new TransactionEvent(
      EventType.BLOCK,
      Network.GOERLI,
      tx,
      receipt,
      [],
      addressez,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(web3);
  });

  describe("handleTransaction", () => {
    it("returns a finding if a flash loan attack is detected", async () => {
      const flashLoanTopic =
        "0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac";

      const mockAddress = [
        "0xB44ddb00B19a2F20E3c1C31A14C8965D75a8e4De",
        "0xfD6b4BF0b1DeA54D6A684F3044EFd59fCDD2C3aC",
        "0x99cD1385f95CC5Bd3F88E542F8fcF8A675c291FC",
      ];
      const data = web3.eth.abi.encodeParameters(
        ["address", "address", "address", "uint256", "uint256", "uint16"],
        [mockAddress[0], mockAddress[1], mockAddress[2], 10000, 10000, 500]
      );

      const flashLoanEvent = {
        topics: [flashLoanTopic],
        data: data,
      };
      const protocolAddress = "0xacd43e627e64355f1861cec6d3a6688b31a6f952";
      const blockNumber = 100;
      const txEvent = createTxEvent({
        gasUsed: "7000001",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
          [protocolAddress]: true,
        },
        logs: [flashLoanEvent],
        blockNumber,
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if a flash loan attack is detected", async () => {
      const flashLoanTopic =
        "0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac";

      const mockAddress = [
        "0xB44ddb00B19a2F20E3c1C31A14C8965D75a8e4De",
        "0xfD6b4BF0b1DeA54D6A684F3044EFd59fCDD2C3aC",
        "0x99cD1385f95CC5Bd3F88E542F8fcF8A675c291FC",
      ];
      const data = web3.eth.abi.encodeParameters(
        ["address", "address", "address", "uint256", "uint256", "uint16"],
        [mockAddress[0], mockAddress[1], mockAddress[2], 100000, 100000, 5000]
      );

      const flashLoanEvent = {
        topics: [flashLoanTopic],
        data: data,
      };
      const protocolAddress = "0xacd43e627e64355f1861cec6d3a6688b31a6f952";
      const blockNumber = 100;
      const txEvent = createTxEvent({
        gasUsed: "7000001",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
          [protocolAddress]: true,
        },
        logs: [flashLoanEvent],
        blockNumber,
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Flash Loan with huge amount",
          description: `Flash Loan with huge amount of 100000 detected for ${protocolAddress}`,
          alertId: "NETHFORTA-16",
          protocol: "aave",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            protocolAddress,
            balanceDiff: "100000",
            loans: JSON.stringify([flashLoanEvent]),
          },
        }),
      ]);
    });
  });
});
