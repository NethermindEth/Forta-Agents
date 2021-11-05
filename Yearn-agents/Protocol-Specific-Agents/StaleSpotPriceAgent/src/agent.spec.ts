import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from 'forta-agent';
import { encodeEventSignature, TestTransactionEvent } from 'forta-agent-tools';
import { providehandleTransaction } from './agent';
import MakerFetcher from './maker.fetcher';
import Mock, { Args } from './mock/mock';
import { createFinding } from './utils';

const address = '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3';
const eventSignature = 'Poke(bytes32,bytes32,uint256)';
const previousHourForActivatingAgent = 1453879385; // Wed Jan 27 2016 07:23:05 GMT
const lessThan3Hours = 1453878381; // "Mon, 27 Jun 2016 09:06:21 GMT"
const greaterThan3hours = 1453885581; // "Mon, 27 Jun 2016 11:23:01 GMT"
const differentHour = 1453904585; // "Mon, 27 Jun 2016 16:56:21 GMT"

const createMock = (args: Args) => {
  return {
    eth: {
      Contract: Mock.build_Mock(args),
    },
  } as any;
};

describe('high gas agent', () => {
  let handleTransaction: HandleTransaction;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return empty finding', async () => {
    const args = [true, true];
    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = providehandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    ) as any;

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if function is correctly called', async () => {
    const args = [true, true];
    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = providehandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2 = new TestTransactionEvent()
      .setTimestamp(lessThan3Hours)
      .addEventLog(
        eventSignature,
        address,
        '0x4554482d430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f64f1ddef9b8d800000000000000000000000000000000000000000021bbfa7d2b17a07be07e1e1e1e'
      ) as any;

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([]);
  });

  it('should return finding if function is correctly called', async () => {
    const args = [true, true];
    const mockWeb3 = createMock(args);
    const fetcher = new MakerFetcher(mockWeb3);
    handleTransaction = providehandleTransaction(mockWeb3, fetcher);

    let findings: Finding[] = [];

    const txEvent: any = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    ) as any;

    const txEvent2: any = new TestTransactionEvent().setTimestamp(
      lessThan3Hours
    );

    const txEvent3: any = new TestTransactionEvent().setTimestamp(
      greaterThan3hours
    );

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });
});
