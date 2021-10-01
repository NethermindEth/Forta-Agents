import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  EventType,
  Network,
  Transaction,
  Receipt,
  Block
} from "forta-agent";
import FailureCounter from "./failure.counter";
import agent, {
  HIGH_FAILURE_THRESHOLD,
  TIME_INTERVAL,
  createFinding
} from "./agent";

interface TxEventInfo {
  status: boolean;
  hash: string;
  timestamp: number;
  addresses: {
    [key: string]: boolean;
  };
}

const testAddresses: string[] = ["0x1", "0x2", "0x3"];

const createTxEvent = ({
  status,
  hash,
  timestamp,
  addresses
}: TxEventInfo): TransactionEvent => {
  const tx: Transaction = { hash } as Transaction;
  const receipt: Receipt = { status } as Receipt;
  const block: Block = { timestamp } as Block;
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

const createTestFinding = (
  addr: string,
  txns: string[],
  threshold: number
): Finding => {
  while (txns.length > threshold) txns.shift();
  return createFinding(addr, txns);
};

const provideHandleTransaction = (
  interval: number,
  threshold: number
): HandleTransaction => {
  return agent.provideHandleTransaction(
    new FailureCounter(interval, threshold),
    testAddresses
  );
};

const txGenerator = (
  amount: number,
  addresses: string[],
  start: number = 0,
  status: boolean = false
): TransactionEvent[] => {
  const txns: TransactionEvent[] = [];

  for (let i: number = 0; i < amount; ++i) {
    const event: TxEventInfo = {
      status: status,
      hash: `0x${i}`,
      timestamp: i + start,
      addresses: {}
    };
    addresses.forEach((addr) => (event.addresses[addr] = true));
    txns.push(createTxEvent(event));
  }

  return txns;
};

describe("High volume of failed txs agent test suit", () => {
  let handleTransaction: HandleTransaction;
  const threshold: number = HIGH_FAILURE_THRESHOLD + 10;

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(10, threshold);
  });

  describe("handleTransaction", () => {
    it("Should report 0 findings if transactions are under the threshold", async () => {
      const txns: TransactionEvent[] = txGenerator(
        HIGH_FAILURE_THRESHOLD,
        testAddresses
      );
      for (let i: number = 0; i < txns.length; ++i) {
        const findings: Finding[] = await handleTransaction(txns[i]);
        expect(findings).toStrictEqual([]);
      }
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
          testAddresses
        );
        for (let i: number = 0; i < txns.length; ++i) {
          addr1hashes.push(txns[i].hash);
          addr2hashes.push(txns[i].hash);
          await handleTransaction(txns[i]);
        }

        const txnAddr1And2: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA",
          timestamp: HIGH_FAILURE_THRESHOLD,
          addresses: {
            "0x1": true,
            "0x2": true
          }
        });
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
            "0x1": true
          }
        });
        addr1hashes.push("0xA1");
        findings = await handleTransaction(txnAddr1);
        expect(findings).toStrictEqual([
          createTestFinding("0x1", addr1hashes, threshold)
        ]);

        const txnAddr2: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA2",
          timestamp: HIGH_FAILURE_THRESHOLD + 2,
          addresses: {
            "0x2": true
          }
        });
        addr2hashes.push("0xA2");
        findings = await handleTransaction(txnAddr2);
        expect(findings).toStrictEqual([
          createTestFinding("0x2", addr2hashes, threshold)
        ]);

        const txnAddr3: TransactionEvent = createTxEvent({
          status: false,
          hash: "0xA3",
          timestamp: HIGH_FAILURE_THRESHOLD + 3,
          addresses: {
            "0x3": true
          }
        });
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
            "0x2": true
          }
        });
        addr1hashes.push("0xAB");
        addr2hashes.push("0xAB");
        findings = await handleTransaction(txnAddr1And2);
        expect(findings).toStrictEqual([
          createTestFinding("0x1", addr1hashes, threshold),
          createTestFinding("0x2", addr2hashes, threshold)
        ]);
      });

      it("Should ignore successful transactions", async () => {
        const txns: TransactionEvent[] = txGenerator(
          HIGH_FAILURE_THRESHOLD,
          testAddresses,
          HIGH_FAILURE_THRESHOLD + 1,
          true
        );
        for (let i: number = 0; i < txns.length; ++i) {
          addr1hashes.push(txns[i].hash);
          addr2hashes.push(txns[i].hash);
          const findings = await handleTransaction(txns[i]);
          expect(findings).toStrictEqual([]);
        }
      });

      it("Should ignore successful transactions and keep the failed ones", async () => {
        let txnAddr1: TransactionEvent = createTxEvent({
          status: true,
          hash: "0xA1",
          timestamp: HIGH_FAILURE_THRESHOLD + 1,
          addresses: {
            "0x1": true
          }
        });
        findings = await handleTransaction(txnAddr1);
        expect(findings).toStrictEqual([]);

        txnAddr1 = createTxEvent({
          status: false,
          hash: "0xA2",
          timestamp: HIGH_FAILURE_THRESHOLD + 2,
          addresses: {
            "0x1": true
          }
        });
        addr1hashes.push("0xA2");
        findings = await handleTransaction(txnAddr1);
        expect(findings).toStrictEqual([
          createTestFinding("0x1", addr1hashes, threshold)
        ]);
      });

      it("Should drop old transactions", async () => {
        const txns: TransactionEvent[] = txGenerator(
          HIGH_FAILURE_THRESHOLD,
          testAddresses,
          TIME_INTERVAL * 60
        );
        for (let i: number = 0; i < txns.length; ++i) {
          const findings: Finding[] = await handleTransaction(txns[i]);
          expect(findings).toStrictEqual([]);
        }
      });

      it("Should report the amount of failed transactions", async () => {
        const amountTxn: number = 200;
        const txns: TransactionEvent[] = txGenerator(
          amountTxn,
          ["0x1"],
          HIGH_FAILURE_THRESHOLD + 1
        );
        for (let i: number = 0; i < amountTxn; ++i) {
          addr1hashes.push(txns[i].hash);
          const findings: Finding[] = await handleTransaction(txns[i]);
          expect(findings).toStrictEqual([
            createTestFinding("0x1", addr1hashes, threshold)
          ]);
        }
      });
    });
  });
});
