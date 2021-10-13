import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { Trace } from "forta-agent/dist/sdk/trace";
import agent, { createFinding } from "./index";

interface TraceInfo {
  from: string;
  addr: string;
  type: string;
}

const createTxEvent = (data: TraceInfo[]): TransactionEvent => {
  const traces: Trace[] = data.map((traceInfo: TraceInfo) => {
    return {
      type: traceInfo.type,
      action: {
        from: traceInfo.from
      },
      result: {
        address: traceInfo.addr
      }
    } as Trace;
  });
  const txn: TransactionEvent = { traces } as TransactionEvent;
  return txn;
};

describe("Contracts deployed by contracts agent test suit", () => {
  const mockGetCode = jest.fn();
  const handleTransaction: HandleTransaction =
    agent.provideHandleTransaction(mockGetCode);

  beforeEach(() => {
    mockGetCode.mockClear();
  });

  describe("handleTransaction", () => {
    it("Should report 0 findings if no traces are provided", async () => {
      const txn: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([]);
      expect(mockGetCode).toHaveBeenCalledTimes(0);
    });

    it("Should report 0 findings if no contract creation by other contract occur", async () => {
      const txn: TransactionEvent = createTxEvent([
        {
          from: "0x1",
          addr: "0x2",
          type: "call"
        },
        {
          from: "0x1",
          addr: "0x3",
          type: "staticcall"
        },
        {
          from: "0x3",
          addr: "0x4",
          type: "delegatecall"
        }
      ]);
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([]);
      expect(mockGetCode).toHaveBeenCalledTimes(0);
    });

    it("Should report only the contract that deploy other contracts", async () => {
      const txn: TransactionEvent = createTxEvent([
        {
          from: "0x1",
          addr: "0x2",
          type: "create"
        },
        {
          from: "0x2",
          addr: "0x3",
          type: "create"
        },
        {
          from: "0x3",
          addr: "0x4",
          type: "create"
        },
        {
          from: "0x5",
          addr: "0x6",
          type: "create"
        }
      ]);
      mockGetCode
        .mockReturnValueOnce("0x")
        .mockReturnValueOnce("0xSOME-CODE")
        .mockReturnValueOnce("0xSOME-CODE")
        .mockReturnValueOnce("0x");
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([
        createFinding("0x2", "0x3"),
        createFinding("0x3", "0x4")
      ]);
      expect(mockGetCode).toHaveBeenCalledTimes(4);
      expect(mockGetCode).nthCalledWith(1, "0x1");
      expect(mockGetCode).nthCalledWith(2, "0x2");
      expect(mockGetCode).nthCalledWith(3, "0x3");
      expect(mockGetCode).nthCalledWith(4, "0x5");
    });
  });
});
