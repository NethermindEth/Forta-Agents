import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import { createAddress, encodeParameters, TestTransactionEvent } from 'forta-agent-tools';
import provideApplyNewFeesAgent, { NEW_FEE_EVENT_SIG } from '../agents/apply.newfee';

import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = createAddress('0X1111');
const ALERT_ID = 'NETHFORTA-21-11';

describe('Add Pool agent', () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideApplyNewFeesAgent(ALERT_ID, ADDRESS);
  });

  it('should create a finding', async () => {
    const data = encodeParameters(
      ['address'],
      [ADDRESS]
    );
    
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      NEW_FEE_EVENT_SIG,
      ADDRESS,
      data
    );
    
 
    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'NewFee set',
        description: 'DAO has assigned a new fee to a pool',
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          address: ADDRESS,
        }
      }),
    ]);
  });

  it('should return empty finding', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      'Wrong Signature',
      '0x123'
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
