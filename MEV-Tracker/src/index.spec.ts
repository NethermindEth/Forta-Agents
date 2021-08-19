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

interface Addresses{
  [key: string]: boolean,
}

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

const createTxEvent  = (
  { hash, to, number }: TxEventInfo, 
  extra_addresses: Addresses = {}
) : TransactionEvent => {
  const tx: Transaction = { hash, to } as Transaction;
  const receipt: Receipt = { } as Receipt;
  const block: Block = { number } as Block;
  const addresses: Addresses = {
    [to]: true,
    ...extra_addresses,
  }
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

    describe('Mocking the API', () => {
      const mockGet = jest.fn();
      const handleTransaction: HandleTransaction = agent.provideHandleTransaction(
        mockGet,
        PROTOCOLS,
      );

      beforeEach(() => {
        mockGet.mockClear();
      });

      it('Should report 0 findings if the block has no bundle', async () => {
        mockGet.mockReturnValueOnce({
          data:{
            blocks: [],
          }
        });
        const txn: TransactionEvent = createTxEvent({
          hash: "0xH1",
          number: 1,
          to: "0x1",
        });
        const findings: Finding[] = await handleTransaction(txn);
        expect(findings).toStrictEqual([]);
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(getAPIUrl(1));
      });

      it('Should report 0 findings if the transaction is not inside the bundle', async () => {
        mockGet.mockReturnValueOnce({
          data:{
            blocks: [{
              transactions: [{
                transaction_hash: "0xH1",
              }],
            }],
          }
        });
        const txn: TransactionEvent = createTxEvent({
          hash: "0xH2",
          number: 2,
          to: "0x2",
        });
        const findings: Finding[] = await handleTransaction(txn);
        expect(findings).toStrictEqual([]);
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(getAPIUrl(2));
      });

      it('Should ignore transaction without protocols of interest', async () => {
        const txn: TransactionEvent = createTxEvent({
          hash: "0xH20",
          number: 20,
          to: "0x20",
        });
        const findings: Finding[] = await handleTransaction(txn);
        expect(findings).toStrictEqual([]);
        expect(mockGet).toHaveBeenCalledTimes(0);
      });

      it('Should report all the protocols used inside the bundled transaction', async () => {
        mockGet.mockReturnValueOnce({
          data:{
            blocks: [{
              transactions: [{
                transaction_hash: "0xH3",
                bundle_type: "nethermind-flasbots",
              }],
            }],
          }
        });
        const txn: TransactionEvent = createTxEvent(
          {
            hash: "0xH3",
            number: 3,
            to: "0x3",
          }, 
          { "0x1": true },
        );
        const findings: Finding[] = await handleTransaction(txn);
        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "Protocol interaction inside a MEV bundle",
            description: `Protocol used (0x1)`,
            alertId: "NETHERMIND-AGENTS-10",
            type: FindingType.Suspicious,
            severity: FindingSeverity.Info,
            metadata: {
              bundle_type: "nethermind-flasbots",
              hash: "0xH3",
            },
          }),
          Finding.fromObject({
            name: "Protocol interaction inside a MEV bundle",
            description: `Protocol used (0x3)`,
            alertId: "NETHERMIND-AGENTS-10",
            type: FindingType.Suspicious,
            severity: FindingSeverity.Info,
            metadata: {
              bundle_type: "nethermind-flasbots",
              hash: "0xH3",
            },
          })
        ]);
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(getAPIUrl(3));
      });
    });
  });
});

