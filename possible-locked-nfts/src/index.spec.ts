import {
  TransactionEvent,
  Finding,
  HandleTransaction,
  Trace,
} from "forta-agent";
import agent, {
  createFinding,
  SIGHASH,
} from ".";
import { utils } from 'ethers';

const EMPTY_METHOD: string = "0x00000000";
const protocols: string[] = [
  "0x1", "0x2", "0x3",
];
const addresses: string[] = [
  "0x0f51bb10119727a7e5ea3538074fb341f56b09ad",
  "0x00010000219ab540356cbb839cbe05303d7705fa",
  "0x00000000219ab540356cbb839cbe05303d7705fb",
];

interface TraceInfo {
  from: string,
  to: string,
  tokenId: number,
  contract: string,
  method: string,
}

const encodeUint256 = (uint256: number) => 
  utils.defaultAbiCoder.encode(["uint256"], [uint256])[0];

const encodeTransferFromInput = (trace:TraceInfo): string =>
  trace.method + utils.defaultAbiCoder.encode(
    ["address", "address", "uint256"], 
    [trace.from, trace.to, trace.tokenId],
  ).slice(2);

const createTxEvent  = (data: TraceInfo[]) : TransactionEvent => {
  const traces: Trace[] = data.map((traceInfo: TraceInfo) => {
    return {
      action: {
        to: traceInfo.contract,
        input: encodeTransferFromInput(traceInfo),
      },
    } as Trace;
  });
  const txn: TransactionEvent = { traces } as TransactionEvent;
  return txn;
};

describe("Possible locked nfts agent test suit", () => {
  const mockGetCode = jest.fn();
  let handleTransaction: HandleTransaction = agent.provideHandleTransaction(
    mockGetCode,
    protocols,
  );

  beforeEach(() => {
    mockGetCode.mockClear();
  });

  describe("handleTransaction", () => {
    it("Should ignore txns to non-interesting protocols", async () => {
      const txn: TransactionEvent = createTxEvent([{
        contract: addresses[0], // non interesting protocol
        from: addresses[1],
        to: addresses[2],
        tokenId: 0,
        method: SIGHASH,
      }]);
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([]);
      expect(mockGetCode).toBeCalledTimes(0);
    });

    it("Should ignore txns not calling trasferFrom", async () => {
      const txn: TransactionEvent = createTxEvent([{
        contract: "0x1",
        from: addresses[1],
        to: addresses[2],
        tokenId: 0,
        method: EMPTY_METHOD, // non transferFrom Sighash
      }]);
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([]);
      expect(mockGetCode).toBeCalledTimes(0);
    });

    it("Should detect insecure calls to transferForm", async () => {
      const txn: TransactionEvent = createTxEvent([
        {
          contract: "0x1",
          from: addresses[1],
          to: addresses[2],
          tokenId: 10,
          method: SIGHASH,
        },
        {
          contract: "0x2",
          from: addresses[2],
          to: addresses[1],
          tokenId: 5,
          method: SIGHASH,
        },
      ]);
      mockGetCode
        .mockReturnValueOnce("0xCode1")
        .mockReturnValueOnce("0xCode2");
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([
        createFinding("0x1", addresses[2], 10),
        createFinding("0x2", addresses[1], 5),
      ]);
      expect(mockGetCode).toBeCalledTimes(2);
      expect(mockGetCode).nthCalledWith(1, addresses[2]);
      expect(mockGetCode).nthCalledWith(2, addresses[1]);
    });
  });
});
