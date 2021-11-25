import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import Web3 from "web3";
import provideRelyFunctionHandler from "./rely.function";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools";
import { when } from "jest-when";

const CONTRACTS: string[][] = [ // index represent a timestamp
  [], // no contracts at timestamp 0
  [createAddress("0xa0"), createAddress("0xa1")],
  [createAddress("0xb0"), createAddress("0xb1"), createAddress("0xb2")],
  [createAddress("0xc0")],
]
const ADDRESS = createAddress("0x1");
const ABI = new Web3().eth.abi;

export const createFinding = (to: string, address: string) => {
    return Finding.fromObject({
    name: "Maker OSM Contract RELY Function",
    description: "RELY Function is called",
    alertId: "MakerDAO-OSM-3",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    everestId: "0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437",
    metadata: {
      contract: to,
      reliedAddress: address,
    },
  });
}

describe("OSM Rely Function Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = { get: jest.fn()};
    handleTransaction = provideRelyFunctionHandler(mockFetcher);

    when(mockFetcher.get).calledWith(1).mockReturnValue(CONTRACTS[1]);
    when(mockFetcher.get).calledWith(2).mockReturnValue(CONTRACTS[2]);
    when(mockFetcher.get).calledWith(3).mockReturnValue(CONTRACTS[3]);
  });

  it("should return a finding for one of the OSM contract", async () => {
    const _from = createAddress("0x2");
    const _to = CONTRACTS[1][0]; 
    const _input: string = ABI.encodeFunctionCall(
      {
        name: "rely",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "usr",
          },
        ],
      },
      [ADDRESS]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(1)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(_to, ADDRESS)]);
  });

  it("should return multiple findings", async () => {
    const _from = createAddress("0x2");
    const _input: string = ABI.encodeFunctionCall(
      {
        name: "rely",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "usr",
          },
        ],
      },
      [ADDRESS]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(2)
      .addTraces({
        to: CONTRACTS[2][2],
        from: _from,
        input: _input,
      },{
        to: CONTRACTS[2][1],
        from: _from,
        input: _input,
      });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(CONTRACTS[2][1], ADDRESS),
      createFinding(CONTRACTS[2][2], ADDRESS),
    ]);
  });

  it("should return empty finding when OSM contract address does found", async () => {
    const _from = createAddress("0x2");
    const _to = createAddress("0x1"); // BAD ADDRESS
    const _input: string = ABI.encodeFunctionCall(
      {
        name: "rely",
        type: "function",
        inputs: [
          {
            type: "address",
            name: "usr",
          },
        ],
      },
      [ADDRESS]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(3)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
