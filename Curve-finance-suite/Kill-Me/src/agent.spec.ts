import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import {
  provideKillMeAgent, 
} from './agent';
import { 
  encodeFunctionSignature, 
  TestTransactionEvent, 
  createAddress
} from "forta-agent-tools";

const ADDRESS = createAddress('0x1');
const ALERT_ID = 'Kill me Agent test';
const sender_address = createAddress('0x5');
const createFinding = (from: string, contract_address: string) => Finding.fromObject({
  name: 'Kill Me function call Detected',
  description: 'Kill Me function called on Curve-Stable-Swap contract.',
  alertId: ALERT_ID,
  severity: 2,
  type: 2,
  metadata: {
    from: from,
    contract_address: contract_address,    

},
});

describe('Kill me agent for Curve StableSwap contract tests suite', () => {
  let handleTransaction: HandleTransaction = provideKillMeAgent(ALERT_ID, ADDRESS);
  let selector: string ;
  let wrongSelector: string;
  beforeAll(() => {
    selector = encodeFunctionSignature('kill_me()');
    wrongSelector = encodeFunctionSignature('killme()');

  });

  it('should return kill_me function call finding', async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: sender_address,
      to: ADDRESS,
      input: selector,
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(sender_address, ADDRESS)]);

  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding because of wrong signature", async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: sender_address,
      to: ADDRESS,
      input: wrongSelector,
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
  
  it("should ignore kill_me calls to other contracts", async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: sender_address,
      to: createAddress('0x2'),
      input: selector,
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
