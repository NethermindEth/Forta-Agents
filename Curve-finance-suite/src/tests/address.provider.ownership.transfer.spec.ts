import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import { TestTransactionEvent, encodeParameters } from 'forta-agent-tools';

import provideCommitNewAdminEvent, {
  COMMIT_NEW_ADMIN_SIGNATURE,
} from '../agents/address.provider.ownership.transfer';

const ADDRESS = '0x1212';
const ALERT_ID = 'test';
const NEW_ADMIN = '0xedf2c58e16cc606da1977e79e1e69e79c54fe242';
const DURATION = '1';

describe('Transfer Ownership Agent for Registry Contract', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideCommitNewAdminEvent(ALERT_ID, ADDRESS);
  });

  it('should return a finding', async () => {
    const data = encodeParameters(
      ['uint256','address'],
      [DURATION, NEW_ADMIN]
    )

    const txEvent: TransactionEvent = new TestTransactionEvent()
    .addEventLog(
      COMMIT_NEW_ADMIN_SIGNATURE,
      ADDRESS,
      data,
    )

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Curve Admin Event Detected',
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
const data = encodeParameters(
      ['uint256','address'],
      [DURATION, NEW_ADMIN]
    )

    const txEvent: TransactionEvent = new TestTransactionEvent()
    .addEventLog(
      'bad sig',
      ADDRESS,
      data,
    )
  
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding because of wrong address', async () => {
    const data = encodeParameters(
      ['uint256','address'],
      [DURATION, NEW_ADMIN]
    )

    const txEvent: TransactionEvent = new TestTransactionEvent()
    .addEventLog(
      COMMIT_NEW_ADMIN_SIGNATURE,
      '0x',
      data,
    )

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
