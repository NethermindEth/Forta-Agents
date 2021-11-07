import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from 'forta-agent';
import {
  createAddress,
  encodeFunctionSignature,
  TestTransactionEvent,
} from 'forta-agent-tools';
import Mock, { strategies, isActive, name, Args } from './mock/mock';
import { provideHandleTransaction } from './agent';
import {
  JUG_CONTRACT,
  JUG_DRIP_FUNCTION_SIGNATURE,
  POKE_SIGNATURE,
  SPOT_ADDRESS,
  createStaleSpotFinding,
} from './utils';
import MakerFetcher from './maker.fetcher';

const previousHourForActivatingAgent = 1609480876; //Fri Jan 01 2021 06:01:16 GMT
const lessThan3Hours = 1609488316; // Fri Jan 01 2021 08:05:16 GMT"
const greaterThan3hours = 1609499416; // Fri Jan 01 2021 11:10:16 GMT"
const differentHour = 1609513816; // Fri Jan 01 2021 15:10:16 GMT

const createMock = (args: Args) => {
  return {
    eth: {
      Contract: Mock.build_Mock(args),
    },
  } as any;
};

const createFindingSF = (_strategy: any, collateralType: string): Finding => {
  return Finding.fromObject({
    name: 'Stability Fee Update Detection',
    description: "stability Fee is changed for MAKER strategy's collateral",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    alertId: 'Maker-3-1',
    protocol: 'Maker',
    metadata: {
      strategy: _strategy,
      collateralType: collateralType,
    },
  });
};

describe('Stability Fee Handler Test Suit', () => {
  let handleTransaction: HandleTransaction;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return empty findings ', async () => {
    const args = [true, false];

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);

    let findings: Finding[] = [];

    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    const txEvent: any = new TestTransactionEvent().setStatus(true);

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return finding for active maker ', async () => {
    const args = [false, true];

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);

    let findings: Finding[] = [];

    const selector = encodeFunctionSignature(JUG_DRIP_FUNCTION_SIGNATURE);
    const collateralType =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const INPUT = selector + collateralType;

    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    const txEvent: any = new TestTransactionEvent()
      .addTraces({
        to: JUG_CONTRACT,
        input: INPUT,
      })
      .setStatus(true);

    findings = await handleTransaction(txEvent);

    expect(strategies).toBeCalledTimes(5);
    expect(isActive).toBeCalledTimes(2);
    expect(name).toBeCalledTimes(4);
    expect(findings).toStrictEqual([
      createFindingSF(createAddress('0x3'), '0x' + collateralType),
    ]);
  });

  it('should return empty finding if both inactive maker ', async () => {
    const args = [false, false];

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);

    let findings: Finding[] = [];

    const selector = encodeFunctionSignature(JUG_DRIP_FUNCTION_SIGNATURE);
    const collateralType =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const INPUT = selector + collateralType;

    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    const txEvent: any = new TestTransactionEvent()
      .addTraces({
        to: JUG_CONTRACT,
        input: INPUT,
      })
      .setStatus(true);

    findings = await handleTransaction(txEvent);

    expect(strategies).toBeCalledTimes(5);
    expect(isActive).toBeCalledTimes(2);
    expect(name).toBeCalledTimes(4);
    expect(findings).toStrictEqual([]);
  });

  it('should return 2 finding for active makers ', async () => {
    const args = [true, true];

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);

    let findings: Finding[] = [];

    const selector = encodeFunctionSignature(JUG_DRIP_FUNCTION_SIGNATURE);
    const collateralType =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const INPUT1 = selector + collateralType;

    const collateralType2 =
      '3554482d43000000000000000000000000000000000000000000000000000000';
    const INPUT2 = selector + collateralType2;

    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    const txEvent: any = new TestTransactionEvent()
      .addTraces({
        to: JUG_CONTRACT,
        input: INPUT1,
      })
      .addTraces({
        to: JUG_CONTRACT,
        input: INPUT2,
      })
      .setStatus(true);

    findings = await handleTransaction(txEvent);

    expect(strategies).toBeCalledTimes(5);
    expect(isActive).toBeCalledTimes(2);
    expect(name).toBeCalledTimes(4);
    expect(findings).toStrictEqual([
      createFindingSF(createAddress('0x2'), '0x' + collateralType),
      createFindingSF(createAddress('0x3'), '0x' + collateralType2),
    ]);
  });
});

//////////////////////////////////////////////////////////////////////////////
/////////////// Spot Price Test Suit ////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

describe('Stale Spot Price Handler Test Suit', () => {
  let handleTransaction: HandleTransaction;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return empty finding', async () => {
    const args = [true, true];
    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if function is correctly called', async () => {
    const args = [true, true];

    const ilk =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setTimestamp(lessThan3Hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([]);
  });

  it('should return finding if function is not called for >= 3 hours', async () => {
    const args = [true, true];

    const ilk =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setTimestamp(lessThan3Hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
    ]);
  });

  it('should return finding if function is not called in out of 3 hours', async () => {
    const args = [true, true];
    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent().setTimestamp(
      lessThan3Hours
    ) as any;

    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
    ]);
  });

  it('should return finding if function is called out of 3 hours', async () => {
    const args = [true, true];

    const ilk =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent().setTimestamp(
      lessThan3Hours
    ) as any;

    const txEvent3 = new TestTransactionEvent()
      .setTimestamp(greaterThan3hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
    ]);
  });

  it('should return 2 finding if function is not called for different hours', async () => {
    const args = [true, true];

    const ilk =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setTimestamp(lessThan3Hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    const txEvent4 = new TestTransactionEvent().setTimestamp(
      differentHour
    ) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleTransaction(txEvent4));

    expect(findings).toStrictEqual([
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
    ]);
  });

  it('should return finding per 3 hours', async () => {
    const args = [true, true];
    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
    ]);
  });

  it('should return empty finding if non-maker ilk called', async () => {
    const args = [true, true];

    const ilk =
      '4D415449432D4100000000000000000000000000000000000000000000000000'; // non-maker ilk
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setTimestamp(lessThan3Hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if txStatus is false', async () => {
    const args = [true, true];

    const ilk =
      '4554482d43000000000000000000000000000000000000000000000000000000';
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setStatus(false)
      .setTimestamp(lessThan3Hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([
      createStaleSpotFinding(SPOT_ADDRESS, createAddress('0x2')),
    ]);
  });

  it('should return empty finding for in-active maker strategy despite of called correctly', async () => {
    const args = [true, false];

    const ilk =
      '5946492d41000000000000000000000000000000000000000000000000000000'; // in-active maker strategy
    const val =
      '0000000000000000000000000000000000000000000000F68C7EE23CFF486180';
    const spot =
      '0000000000000000000000000000000000000021c46287d73842ee06fac8d2d2';
    const INPUT = ilk + val + spot;

    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setTimestamp(lessThan3Hours)
      .addEventLog(POKE_SIGNATURE, SPOT_ADDRESS, INPUT) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([]);
  });
});
