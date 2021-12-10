import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import provideKillMeAgent from '../agents/kill.me';
import { encodeFunctionSignature, TestTransactionEvent, createAddress} from "forta-agent-tools";
import {KILL_ME_SIGNATURE} from '../agents/kill.me';

const ADDRESS = createAddress('0x1');
const ALERTID = 'test';

describe('Kill me agent for Curve StableSwap contract', () => {
  let handleTransaction: HandleTransaction;
  let selector: string ;

  beforeAll(() => {
    handleTransaction = provideKillMeAgent(ALERTID, ADDRESS);
    selector = encodeFunctionSignature(KILL_ME_SIGNATURE);
  });


  it('should return kill_me function call finding', async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      to: ADDRESS,
      input: selector,
    });

    
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Kill Me function call Detected',
        description: 'Kill Me function called on pool',
        alertId: ALERTID,
        protocol: 'ethereum',
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {
          contractAddr: ADDRESS,
        },
      }),
    ]);
  });

  
    it("should return empty finding because of wrong signature", async () => {
      const selector2 = encodeFunctionSignature('killme()');
      const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
        to: ADDRESS,
        input: selector2,
      });

      const findings = await handleTransaction(txEvent);
  
      expect(findings).toStrictEqual([]);
    });
  
    it("should return empty finding because of wrong contract address", async () => {
  
      const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
        to: createAddress('0x2'),
        input: selector,
      });

      const findings = await handleTransaction(txEvent);
  
      expect(findings).toStrictEqual([]);
    });
});
