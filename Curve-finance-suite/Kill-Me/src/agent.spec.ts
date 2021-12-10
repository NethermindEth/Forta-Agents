import {
  Finding,
  FindingSeverity,
  FindingType,
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

const CONTRACT_ADDRESS = createAddress('0x1');
const ALERT_ID = 'Kill me Agent test';
const SENDER_ADDRESS = createAddress('0x5');

const createFinding = (from: string, contract_address: string) => Finding.fromObject({
  name: 'Kill Me function call Detected',
  description: 'Kill Me function called on Curve-Stable-Swap contract.',
  alertId: ALERT_ID,
  severity: FindingSeverity.Low,
  type: FindingType.Suspicious,
  metadata: {
    from: from,
    contract_address: contract_address,    
},
});

describe('Kill me agent for Curve StableSwap contract tests suite', () => {
  let handleTransaction: HandleTransaction = provideKillMeAgent(ALERT_ID, CONTRACT_ADDRESS);
  let selector: string ;
  let wrongSelector: string;
  beforeAll(() => {
    selector = encodeFunctionSignature('kill_me()');
    wrongSelector = encodeFunctionSignature('killme()');

  });

  it('should return kill_me function call finding', async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: SENDER_ADDRESS,
      to: CONTRACT_ADDRESS,
      input: selector,
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(SENDER_ADDRESS, CONTRACT_ADDRESS)]);

  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding because of wrong signature", async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: SENDER_ADDRESS,
      to: CONTRACT_ADDRESS,
      input: wrongSelector,
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
  
  it("should ignore kill_me calls to other contracts", async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: SENDER_ADDRESS,
      to: createAddress('0x2'),
      input: selector,
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
