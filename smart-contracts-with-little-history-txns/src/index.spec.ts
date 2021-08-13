import { 
    Finding, 
    HandleTransaction, 
    TransactionEvent, 
    EventType,
    Network,
    FindingType,
    FindingSeverity,
  } from 'forta-agent';
import { Block } from 'forta-agent/dist/sdk/block';
import { Receipt } from 'forta-agent/dist/sdk/receipt';
import { Transaction } from 'forta-agent/dist/sdk/transaction';
import agent, { 
  queryUrl,
  TIMESTAMP_THRESHOLD,
  HISTORY_THRESHOLD
} from "./index";

interface TxEventInfo {
  to: string, 
  timestamp: number, 
};

interface QueryResult {
  contractAddress: string,
  timestamp: number,
}
  
const createTxEvent  = ({ to, timestamp } : TxEventInfo) : TransactionEvent => {
  const tx: Transaction = { to } as Transaction;
  const receipt: Receipt = { } as Receipt;
  const block: Block = { timestamp } as Block;
  return new TransactionEvent(EventType.BLOCK, Network.MAINNET, tx, receipt, [], {}, block);
};

describe("Recently-created smart contracts with very little history agent tests suit", () => {
  const mockAxiosGet = jest.fn();
  const emptyElements: QueryResult[] = new Array(HISTORY_THRESHOLD - 1);
  let handleTransaction: HandleTransaction = agent.provideHandleTransaction(mockAxiosGet);

  beforeEach(() => {
    mockAxiosGet.mockClear();
  });

  describe("handleTransaction", () => {
    it('Should report recently created contract', async () => {
      const addr: string = "0x1";
      const timestamp: number = 100000;
      const date: Date = new Date(timestamp * 1000);
      const result: QueryResult[] = [{
        contractAddress: addr, 
        timestamp: timestamp,
      }, ...emptyElements]; 
      mockAxiosGet.mockReturnValueOnce({
        data: {
          result: result,
        },
      });
      const txn: TransactionEvent = createTxEvent({ to:addr, timestamp });
      const findings = await handleTransaction(txn);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Transaction to an smart contract recently created",
          description: `Contract created on ${date.toUTCString()}`,
          alertId: "NETHERMIND-AGENTS-02",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
        }),
      ]);
      expect(mockAxiosGet).toBeCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(queryUrl(addr));
    });

    it('Should report contract with little history', async () => {
      const addr: string = "0x2";
      
      const result: QueryResult[] = [{
        contractAddress: addr, 
        timestamp: 0,
      }]; 
      mockAxiosGet.mockReturnValueOnce({
        data: {
          result: result,
        },
      });
      const txn: TransactionEvent = createTxEvent({ 
        to: addr, 
        timestamp: TIMESTAMP_THRESHOLD + 1, 
      });
      const findings = await handleTransaction(txn);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Transaction to an smart contract with little history",
          description: `Contract (${addr}) has only ${result.length} internal transactions`,
          alertId: "NETHERMIND-AGENTS-02",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
        }),
      ]);
      expect(mockAxiosGet).toBeCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(queryUrl(addr));
    });

    it('Should report multiple findings', async () => {
      const addr: string = "0x3";
      
      const result: QueryResult[] = [{
        contractAddress: addr, 
        timestamp: 0,
      }]; 
      mockAxiosGet.mockReturnValueOnce({
        data: {
          result: result,
        },
      });
      const txn: TransactionEvent = createTxEvent({ 
        to: addr, 
        timestamp: 0, 
      });
      const findings = await handleTransaction(txn);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Transaction to an smart contract with little history",
          description: `Contract (${addr}) has only ${result.length} internal transactions`,
          alertId: "NETHERMIND-AGENTS-02",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
        }),
        Finding.fromObject({
          name: "Transaction to an smart contract recently created",
          description: `Contract created on ${new Date(0).toUTCString()}`,
          alertId: "NETHERMIND-AGENTS-02",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
        }),
      ]);
      expect(mockAxiosGet).toBeCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(queryUrl(addr));
    });

    it('Should report 0 findings', async () => {
      const addr: string = "0x4";
  
      const result: QueryResult[] = [{
        contractAddress: addr, 
        timestamp: 0,
      }, ...emptyElements]; 
      mockAxiosGet.mockReturnValueOnce({
        data: {
          result: result,
        },
      });
      const txn: TransactionEvent = createTxEvent({ 
        to: addr, 
        timestamp: TIMESTAMP_THRESHOLD + 1,
      });
      const findings = await handleTransaction(txn);
      expect(findings).toStrictEqual([]);
      expect(mockAxiosGet).toBeCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(queryUrl(addr));
    });
  });
});
