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
  let handleTransaction: HandleTransaction = agent.provideHandleTransaction(mockAxiosGet);

  beforeEach(() => {
    mockAxiosGet.mockClear();
  });

  describe("handleTransaction", () => {
    it('Shoul report recently created contract', async () => {
      const addr: string = "0x1";
      const timestamp: number = 100000;
      const date: Date = new Date(timestamp * 1000);
      const emptyElements: QueryResult[] = new Array(HISTORY_THRESHOLD - 1);
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
  });
});
