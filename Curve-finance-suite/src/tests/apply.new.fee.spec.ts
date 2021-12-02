import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import provideApplyNewFeesAgent, { NEW_FEE_EVENT_SIG } from '../agents/apply.newfee';

import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = '0X1111';
const ALERT_ID = 'NETHFORTA-21-11';

describe('Add Pool agent', () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideApplyNewFeesAgent(ALERT_ID, ADDRESS);
  });

  it('should create a finding', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(NEW_FEE_EVENT_SIG, ADDRESS);

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'NewFee set',
        description: 'DAO has assigned a new fee to a pool',
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          address: "0X1111",
          /*
            TODO
            Missing data here that is needed to complete the test
            The format of the data should be as follows:

            "data": undefined,
            "topics": Array [
              "0xbe12859b636aed607d5230b2cc2711f68d70e51060e6cca1f575ef5d2fcc95d1",
            ],

            However I was not able to structure the data to get it working 
            with Typescript at runtime

            This test will continue to fail until this is fixed
          */
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
