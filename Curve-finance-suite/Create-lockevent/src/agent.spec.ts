import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import {
  provideCreateLockAgent, 
} from './agent';
import { 
  TestTransactionEvent, 
  createAddress,
  encodeParameter,
  encodeParameters
} from "forta-agent-tools";

const CONTRACT_ADDRESS = createAddress('0x1');
const ALERT_ID = 'Create lock Agent test';
const SENDER_ADDRESS = createAddress('0x5');
const EVENT_SIGNATURE = 'Deposit(address,uint256,uint256,int128,uint256)';

const createFinding = (from: string, value:string, locktime: string ) => Finding.fromObject({
  name: 'Lock creation on Voting Escrow contract Detected',
  description: 'Deposit event with type 1 was emitted',
  alertId: ALERT_ID,
  severity: FindingSeverity.Low,
  type: FindingType.Suspicious,
  protocol: 'Curve Finance',
  metadata: {
    from: from,
    value: value,
    locktime: locktime,
  },
});

describe('Create Lock for Voting Escrow contract tests suite', () => {
  let handleTransaction: HandleTransaction = provideCreateLockAgent(ALERT_ID, CONTRACT_ADDRESS);
  const topics: string[] = [ 
    encodeParameter('address', SENDER_ADDRESS), 
    encodeParameter('int128', 1764806400),
  ];
  const data: string = encodeParameters(
    ['uint256', 'int128', 'uint256'],
    [5345,1,3],
  ); 
  const data2: string = encodeParameters(
    ['uint256', 'int128', 'uint256'],
    [5555,0,3],
  ); 

  it('should return a finding when Deposit event is emitted with the correct type only', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      CONTRACT_ADDRESS,
      data,
      ...topics,
    );
    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      CONTRACT_ADDRESS,
      data2,
      ...topics,
    );

    const findings = await handleTransaction(txEvent);
    findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([createFinding(SENDER_ADDRESS, '5345','1764806400')]);
  });

  it("should return empty finding because of wrong event signature", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      'sig()',
      CONTRACT_ADDRESS,
      data,
      ...topics,
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
  
  it("should ignore emitted from other contracts", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
     createAddress('0x2'),
      data,
      ...topics,
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});