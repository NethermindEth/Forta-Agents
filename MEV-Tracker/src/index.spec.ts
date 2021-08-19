import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  EventType,
  Network,
} from 'forta-agent';
import axios from 'axios';
import agent, { getAPIUrl } from './index';
import { Transaction } from 'forta-agent/dist/sdk/transaction';
import { Receipt } from 'forta-agent/dist/sdk/receipt';
import { Block } from 'forta-agent/dist/sdk/block';

interface TxEventInfo {
  hash: string,
  to: string,
  number: number,
};

// transaction in a bundle
const txnInBundle = {
  hash: "0x14e3ef169d0bb84683d0a9ba75f45d38526f3a199e97f94e6c2fe4287e260d2d",
  to: "0xcC3938DCc005EacF98Fa53AD05BF861ca2fD485e",
  bundle_type: "flashbots",
  number: 13055778,
};

const PROTOCOLS: string[] = ["0x1", "0x2", "0x3"];

const createTxEvent  = ({ hash, to, number } : TxEventInfo) : TransactionEvent => {
  const tx: Transaction = { hash, to } as Transaction;
  const receipt: Receipt = { } as Receipt;
  const block: Block = { number } as Block;
  return new TransactionEvent(EventType.BLOCK, Network.MAINNET, tx, receipt, [], { [to]:true }, block);
};

describe('MEV-tracker agent test suit', () => {
  describe('handleTransaction', () => {
    it('Should query the API and found the transaction', async () => {
      const handleTransaction:HandleTransaction = agent.provideHandleTransaction(
        axios.get,
        [txnInBundle.to],
      );

      const txn: TransactionEvent = createTxEvent(txnInBundle);
      const findings: Finding[] = await handleTransaction(txn);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Protocol interaction inside a MEV bundle",
          description: `Protocol used (${txnInBundle.to})`,
          alertId: "NETHERMIND-AGENTS-10",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Info,
          metadata: {
            bundle_type: txnInBundle.bundle_type,
            hash: txnInBundle.hash,
          },
        }),
      ]);
    });
  });
});

