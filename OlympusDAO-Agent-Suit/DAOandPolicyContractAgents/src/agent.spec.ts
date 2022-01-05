import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from 'forta-agent';
import {
  createAddress,
  encodeParameter,
  TestTransactionEvent,
} from 'forta-agent-tools';
import agent from './agent';
import {
  ADDED_OWNER_SIG,
  addresses,
  CHANGED_THRESHOLD_SIG,
  REMOVED_OWNER_SIG,
} from './utils';

const createTestAddedOwnerFinding = (owner: string, contract: string) => {
  return Finding.fromObject({
    name: 'Added Owner Event Detection',
    description: 'A new owner is added.',
    alertId: 'Olympus-1-1',
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: 'OlympusDAO',
    metadata: {
      owner: owner,
      contract: contract,
    },
  });
};

const createTestRemovedOwnerFinding = (owner: string, contract: string) => {
  return Finding.fromObject({
    name: 'Removed Owner Event Detection',
    description: 'An owner is removed.',
    alertId: 'Olympus-1-2',
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: 'OlympusDAO',
    metadata: {
      owner: owner,
      contract: contract,
    },
  });
};

const createTestChangedTHFinding = (TH: string, contract: string) => {
  return Finding.fromObject({
    name: 'Change Threshold Event Detection',
    description: 'The threshold is changed.',
    alertId: 'Olympus-1-3',
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: 'OlympusDAO',
    metadata: {
      threshold: TH,
      contract: contract,
    },
  });
};

describe('DAO and POLICY contracts core events Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it('should return empty findings', async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty findings because of wrong sig', async () => {
    const encodedData = encodeParameter('address', createAddress('0x1'));

    const txEvent = new TestTransactionEvent().addEventLog(
      'wrong_Sig',
      addresses[0], // Policy Contract
      encodedData
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty findings because of wrong address', async () => {
    const encodedData = encodeParameter('address', createAddress('0x1'));

    const txEvent = new TestTransactionEvent().addEventLog(
      ADDED_OWNER_SIG,
      createAddress('0x2'), // wrong address
      encodedData
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return `AddedOwner` event finding', async () => {
    const encodedData = encodeParameter('address', createAddress('0x1'));

    const txEvent = new TestTransactionEvent()
      .addEventLog(
        ADDED_OWNER_SIG,
        addresses[0], // Policy Contract
        encodedData
      )
      .addEventLog(
        ADDED_OWNER_SIG,
        addresses[1], // DAO Contract
        encodedData
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createTestAddedOwnerFinding(createAddress('0x1'), addresses[0]),
      createTestAddedOwnerFinding(createAddress('0x1'), addresses[1]),
    ]);
  });

  it('should return `RemovedOwner` event finding', async () => {
    const encodedData = encodeParameter('address', createAddress('0x1'));

    const txEvent = new TestTransactionEvent()
      .addEventLog(
        REMOVED_OWNER_SIG,
        addresses[0], // Policy Contract
        encodedData
      )
      .addEventLog(
        REMOVED_OWNER_SIG,
        addresses[1], // DAO Contract
        encodedData
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createTestRemovedOwnerFinding(createAddress('0x1'), addresses[0]),
      createTestRemovedOwnerFinding(createAddress('0x1'), addresses[1]),
    ]);
  });
  it('should return `ChangedThreshold` event finding', async () => {
    const encodedData = encodeParameter('uint256', '2');

    const txEvent = new TestTransactionEvent()
      .addEventLog(
        CHANGED_THRESHOLD_SIG,
        addresses[0], // Policy Contract
        encodedData
      )
      .addEventLog(
        CHANGED_THRESHOLD_SIG,
        addresses[1], // DAO Contract
        encodedData
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createTestChangedTHFinding('2', addresses[0]),
      createTestChangedTHFinding('2', addresses[1]),
    ]);
  });
});
