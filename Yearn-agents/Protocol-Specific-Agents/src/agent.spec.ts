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
import { JUG_CONTRACT, JUG_DRIP_FUNCTION_SIGNATURE } from './utils';
import MakerFetcher from './maker.fetcher';

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
    alertId: 'Maker-3',
    protocol: 'Maker',
    metadata: {
      strategy: _strategy,
      collateralType: collateralType,
    },
  });
};

describe('Protocol Alerts Agent Test Suite', () => {
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
