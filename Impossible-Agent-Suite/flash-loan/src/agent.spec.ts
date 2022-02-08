import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';

import {
  TestTransactionEvent,
  createAddress,
  encodeParameter,
} from 'forta-agent-tools';

import {
  PAIR_SWAP_ABI,
  SWAP_FACTORY_V1_ABI,
  provideHandleTransaction,
} from './agent';

import {
  ethers,
} from 'ethers';

const ALERT_ID: string = 'stablexswap-flash-loan-test';

const PAIRS_ADDR: Set<string> = new Set<string>();

const createFinding = (amount0Out: string, amount1Out: string, to: string, data: string) => Finding.fromObject({
  name: 'Flash Loan Detected',
  description: 'A flash loan has been made on a StableXSwap contract',
  alertId: 'IMPOSSIBLE-5',
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Impossible Finance',
  metadata: {
    amount0Out: amount0Out,
    amount1Out: amount1Out,
    to: to,
    data: data,
  }
});

describe('StableXSwap Flash Loan Agent test suite', () => {
  let handler: HandleTransaction;
  let contract: ethers.utils.Interface;
  // Set the factory address
  const FACTORY_ADDR = createAddress('0xa1');
  // Set addresses for the pairs
  PAIRS_ADDR.add(createAddress('0xb1'));
  PAIRS_ADDR.add(createAddress('0xb2'));
  PAIRS_ADDR.add(createAddress('0xb3'));
  // Set address for user
  const USER_ADDR = createAddress('0xc1');
  // Set address for the flashloan receiver
  const LOAN_RCVR_ADDR = createAddress('0xd1');
  // Set token addresses to be used to generate pair
  const TOKEN0 = createAddress('0xe1');
  const TOKEN1 = createAddress('0xe2');
  // Set result of new pair address
  const NEWPAIR = createAddress('0xf1');

  beforeAll(() => {
    handler = provideHandleTransaction(FACTORY_ADDR, PAIRS_ADDR);
    contract = new ethers.utils.Interface(PAIR_SWAP_ABI);
  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore calls to `swap` which are not a flashloan', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: PAIRS_ADDR.values().next().value,
        from: USER_ADDR,
        input: contract.encodeFunctionData(
          'swap',
          [
            ethers.BigNumber.from('0'),
            ethers.BigNumber.from('1000'),
            LOAN_RCVR_ADDR,
            ethers.BigNumber.from('0'),
          ]
        ),
        output: '0x0',
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect calls to `swap` which are a flashloan on first pair in `PAIRS`' , async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: PAIRS_ADDR.values().next().value,
        from: USER_ADDR,
        input: contract.encodeFunctionData(
          'swap',
          [
            ethers.BigNumber.from('0'),
            ethers.BigNumber.from('1000'),
            LOAN_RCVR_ADDR,
            ethers.BigNumber.from('100'),
          ]
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(
        '0',
        '1000',
        '0x00000000000000000000000000000000000000D1',
        '0x64',
      ),      
    ]);
  });

  it('should detect calls to `swap` which are a flashloan on second pair in `PAIRS`' , async () => {
    const iterator = PAIRS_ADDR.values();
    iterator.next();
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: iterator.next().value,
        from: USER_ADDR,
        input: contract.encodeFunctionData(
          'swap',
          [
            ethers.BigNumber.from('0'),
            ethers.BigNumber.from('1000'),
            LOAN_RCVR_ADDR,
            ethers.BigNumber.from('100'),
          ]
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(
        '0',
        '1000',
        '0x00000000000000000000000000000000000000D1',
        '0x64',
      ),      
    ]);
  });

  it('should detect multiple calls to `swap` with value > 0 in the `data` field', async () => {
    const iterator = PAIRS_ADDR.values();
    iterator.next();
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: iterator.next().value,
        from: USER_ADDR,
        input: contract.encodeFunctionData(
          'swap',
          [
            ethers.BigNumber.from('0'),
            ethers.BigNumber.from('1000'),
            LOAN_RCVR_ADDR,
            ethers.BigNumber.from('100'),
          ]
        )
      }).addTraces({
        to: iterator.next().value,
        from: USER_ADDR,
        input: contract.encodeFunctionData(
          'swap',
          [
            ethers.BigNumber.from('1000'),
            ethers.BigNumber.from('0'),
            LOAN_RCVR_ADDR,
            ethers.BigNumber.from('50'),
          ]
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(
        '0',
        '1000',
        '0x00000000000000000000000000000000000000D1',
        '0x64',
      ),      
      createFinding(
        '1000',
        '0',
        '0x00000000000000000000000000000000000000D1',
        '0x32', 
      ),
    ]);
  });

  it('should update `PAIRS` set when a new pair is created', async () => {
    const SWAP_FACTORY_IFACE: ethers.utils.Interface = new ethers.utils.Interface(SWAP_FACTORY_V1_ABI);
    
    const log = SWAP_FACTORY_IFACE.encodeEventLog(
      SWAP_FACTORY_IFACE.getEvent('PairCreated'),
      [TOKEN0, TOKEN1, NEWPAIR, '0'],
    );

    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      FACTORY_ADDR,
      log.data,
      ...log.topics,
    );

    const numPairsBefore = PAIRS_ADDR.size;

    // We don't need the findings, we just need to update the `PAIRS` set
    await handler(tx);
    
    const numPairsAfter = PAIRS_ADDR.size;
    expect(numPairsAfter == numPairsBefore + 1);
  })
});
