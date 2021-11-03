import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import {
  createAddress,
  encodeFunctionSignature,
  TestBlockEvent,
  TestTransactionEvent,
} from 'forta-agent-tools';
import Mock, { Args } from './mock/mock';
import { provideHandleTransaction } from './agent';
import { JUG_CONTRACT, JUG_DRIP_FUNCTION_SIGNATURE } from './utils';
import MakerFetcher from './maker.fetcher';

const createMock = () => {
  return {
    eth: {
      Contract: Mock.build_Mock(),
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

  it('should return empty findings ', async () => {
    const mockWeb3 = createMock();
    const fetcher = new MakerFetcher(mockWeb3);

    let findings: Finding[] = [];

    handleTransaction = provideHandleTransaction(mockWeb3, fetcher);

    const txEvent: any = new TestTransactionEvent().setStatus(true);

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return findings ', async () => {
    const mockWeb3 = createMock();
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

    expect(findings).toStrictEqual([
      createFindingSF(createAddress('0x2'), '0x' + collateralType),
    ]);
  });
});
