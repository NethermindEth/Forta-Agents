import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';

import provideCommitNewAdminEvent, {
  COMMIT_NEW_ADMIN_SIGNATURE,
} from '../agents/addressprovider.ownership.transfer';

import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = '0x1212';
const ALERT_ID = 'test';
const NEW_ADMIN = '0xedf2c58e16cc606da1977e79e1e69e79c54fe242';
const DURATION = 1;

describe('Transfer Ownership Agent for Registry Contract', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideCommitNewAdminEvent(ALERT_ID, ADDRESS);
  });

  it('should return a finding', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      COMMIT_NEW_ADMIN_SIGNATURE,
      ADDRESS,
      [DURATION, NEW_ADMIN]
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Commit New Admin Event',
        description: 'New Admin Committed.',
        alertId: ALERT_ID,
        severity: FindingSeverity.Medium,
        type: FindingType.Unknown,
        metadata: {
          newAdmin: NEW_ADMIN,
        },
      }),
    ]);
  });
  it('should return empty finding because of wrong SIG', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog('bad sig', ADDRESS, [
      DURATION,
      NEW_ADMIN,
    ]);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding because of wrong address', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      COMMIT_NEW_ADMIN_SIGNATURE,
      '0x',
      [DURATION, NEW_ADMIN]
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
