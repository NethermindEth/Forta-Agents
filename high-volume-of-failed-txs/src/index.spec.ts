import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  EventType,
  Network,
  FindingType,
  FindingSeverity,
} from 'forta-agent';
import { Transaction } from 'forta-agent/dist/sdk/transaction';
import { Receipt } from 'forta-agent/dist/sdk/receipt';
import { Block } from 'forta-agent/dist/sdk/block';
import FailureCounter from './failure.counter';
import agent, { 
  HIGH_FAILURE_THRESHOLD,
  TIME_INTERVAL,
} from "./index";

interface TxEventInfo {
  status: boolean, 
  hash: string, 
  timestamp: number, 
  addresses: {
    [key: string]: boolean
  },
};

const testAddresses: string[] = ["0x1", "0x2", "0x3"];

const createTxEvent  = ({ status, hash, timestamp, addresses } : TxEventInfo) : TransactionEvent => {
  const tx: Transaction = { hash } as Transaction;
  const receipt: Receipt = { status } as Receipt;
  const block: Block = { timestamp } as Block;
  return new TransactionEvent(EventType.BLOCK, Network.MAINNET, tx, receipt, [], addresses, block);
};

const provideHandleTransaction = (interval: number): HandleTransaction => {
  return agent.provideHandleTransaction(
    new FailureCounter(interval),
    testAddresses,
  );
};

const txGenerator = (amount: number, addresses: string[], start: number = 0): TransactionEvent[] => {
  const txns: TransactionEvent[] = [];

  for(let i:number = 0; i < amount; ++i){
    const event: TxEventInfo = {
      status: false,
      hash: `0x${i}`,
      timestamp: i + start,
      addresses: {},
    };
    addresses.forEach((addr) => event.addresses[addr] = true)
    txns.push(createTxEvent(event));
  }

  return txns;
};

describe("High volume of failed txs agent test suit", () => {
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(10); 
  });

  describe("handleTransaction", () => {
    it("Should report 0 findings if transactions are under the threshold", async () => {
      const txns: TransactionEvent[] = txGenerator(
        HIGH_FAILURE_THRESHOLD, 
        testAddresses,
      );
      for(let i: number = 0; i < txns.length; ++i) {
        const findings: Finding[] = await handleTransaction(txns[i]);
        expect(findings).toStrictEqual([]);
      };
    });

    describe("Handle an amount of transactions greater than the threshold", () => {
      let addr1hashes: string[];
      let addr2hashes: string[];
      let findings: Finding[];
      
      beforeEach(async () => {
        addr1hashes = [];
        addr2hashes = [];

        const txns: TransactionEvent[] = txGenerator(
          HIGH_FAILURE_THRESHOLD - 1, 
          testAddresses,
        );
        txns.forEach(async (txn) => {
          addr1hashes.push(txn.hash);
          addr2hashes.push(txn.hash);
          await handleTransaction(txn);
        });

        const txnAddr1And2: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA",
          timestamp: HIGH_FAILURE_THRESHOLD,
          addresses: {
            "0x1": true,
            "0x2": true,
          },
        })
        addr1hashes.push("0xA");
        addr2hashes.push("0xA");
        await handleTransaction(txnAddr1And2);
      });

      it("Should report findings for each address that execed the threshold", async () => {  
        const txnAddr1: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA1",
          timestamp: HIGH_FAILURE_THRESHOLD + 1,
          addresses: {
            "0x1": true,
          },
        })
        addr1hashes.push("0xA1");
        findings = await handleTransaction(txnAddr1);
        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "High volume of failed TXs",
            description: `High failed transactions volume (${addr1hashes.length}) related with 0x1 protocol`,
            alertId: "NETHERMIND-AGENTS",
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
            protocol: "0x1",
            metadata: {
              transactions: JSON.stringify(addr1hashes),
            },
          }),
        ]);
  
        const txnAddr2: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA2",
          timestamp: HIGH_FAILURE_THRESHOLD + 2,
          addresses: {
            "0x2": true,
          },
        })
        addr2hashes.push("0xA2");
        findings = await handleTransaction(txnAddr2);
        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "High volume of failed TXs",
            description: `High failed transactions volume (${addr2hashes.length}) related with 0x2 protocol`,
            alertId: "NETHERMIND-AGENTS",
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
            protocol: "0x2",
            metadata: {
              transactions: JSON.stringify(addr2hashes),
            },
          }),
        ]);
  
        const txnAddr3: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA3",
          timestamp: HIGH_FAILURE_THRESHOLD + 3,
          addresses: {
            "0x3": true,
          },
        })
        findings = await handleTransaction(txnAddr3);
        expect(findings).toStrictEqual([]);
      });

      it("Should report multiple findings", async () => {
        const txnAddr1And2: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xAB",
          timestamp: HIGH_FAILURE_THRESHOLD + 1,
          addresses: {
            "0x1": true,
            "0x2": true,
          },
        })
        addr1hashes.push("0xAB");
        addr2hashes.push("0xAB");
        findings = await handleTransaction(txnAddr1And2);
        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "High volume of failed TXs",
            description: `High failed transactions volume (${addr1hashes.length}) related with 0x1 protocol`,
            alertId: "NETHERMIND-AGENTS",
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
            protocol: "0x1",
            metadata: {
              transactions: JSON.stringify(addr1hashes),
            },
          }),
          Finding.fromObject({
            name: "High volume of failed TXs",
            description: `High failed transactions volume (${addr2hashes.length}) related with 0x2 protocol`,
            alertId: "NETHERMIND-AGENTS",
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
            protocol: "0x2",
            metadata: {
              transactions: JSON.stringify(addr2hashes),
            },
          }),
        ]);
      });

      it("Should ignore successful transactions", async () => {
        const txns: TransactionEvent[] = txGenerator(
          HIGH_FAILURE_THRESHOLD, 
          testAddresses, 
          HIGH_FAILURE_THRESHOLD + 1,
        );
        txns.forEach(async (txn) => {
          addr1hashes.push(txn.hash);
          addr2hashes.push(txn.hash);
          await handleTransaction(txn);
        });
      });

      it("Should ignore successful transactions and keep the failed ones", async () => {
        let txnAddr1: TransactionEvent = createTxEvent({
          status: true,
          hash: "0xA1",
          timestamp: HIGH_FAILURE_THRESHOLD + 1,
          addresses: {
            "0x1": true,
          },
        })
        findings = await handleTransaction(txnAddr1);
        expect(findings).toStrictEqual([]);

        txnAddr1 = createTxEvent({
          status: false,
          hash: "0xA2",
          timestamp: HIGH_FAILURE_THRESHOLD + 2,
          addresses: {
            "0x1": true,
          },
        })
        addr1hashes.push("0xA2");
        findings = await handleTransaction(txnAddr1);
        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "High volume of failed TXs",
            description: `High failed transactions volume (${addr1hashes.length}) related with 0x1 protocol`,
            alertId: "NETHERMIND-AGENTS",
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
            protocol: "0x1",
            metadata: {
              transactions: JSON.stringify(addr1hashes),
            },
          }),
        ]);
      });

      it("Should drop old transactions", async () => {
        const txns: TransactionEvent[] = txGenerator(
          HIGH_FAILURE_THRESHOLD, 
          testAddresses, 
          TIME_INTERVAL * 60,
        );
        for(let i: number = 0; i < txns.length; ++i) {
          const findings: Finding[] = await handleTransaction(txns[i]);
          expect(findings).toStrictEqual([]);
        };
      });

      it("Should report the amount of failed transactions", async () => {
        const amountTxn: number = 10;
        const txns: TransactionEvent[] = txGenerator(
          amountTxn, 
          ["0x1"], 
          HIGH_FAILURE_THRESHOLD + 1,
        );
        for(let i: number = 0; i < amountTxn; ++i) {
          addr1hashes.push(txns[i].hash);
          const findings: Finding[] = await handleTransaction(txns[i]);
          expect(findings).toStrictEqual([
            Finding.fromObject({
              name: "High volume of failed TXs",
              description: `High failed transactions volume (${addr1hashes.length}) related with 0x1 protocol`,
              alertId: "NETHERMIND-AGENTS",
              type: FindingType.Suspicious,
              severity: FindingSeverity.High,
              protocol: "0x1",
              metadata: {
                transactions: JSON.stringify(addr1hashes),
              },
            }),
          ]);
        };
      });
    });
  });
});
