import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction,
} from 'forta-agent';

import {
  createAddress,
  TestTransactionEvent
} from 'forta-agent-tools';

import {
  IF_ABI,
  provideHandleTransaction
} from './agent';

import {
  ethers
} from 'ethers';

// Function to easily create a finding
const createFinding = (receiver: string) => Finding.fromObject({
  name: 'IF token non-whitelist mint',
  description: 'Impossible Finance tokens have been minted to a non-whitelisted address',
  alertId: 'IMPOSSIBLE-2-1',
  severity: FindingSeverity.High,
  type: FindingType.Suspicious,
  protocol: 'Impossible Finance',
  metadata: {
    receiver: receiver.toLowerCase(),
  }
});

// Function to easily generate log data for transfers
const generateTransferLog = (contract: ethers.utils.Interface, from: string, to: string, value: string) => {
  return contract.encodeEventLog(
    contract.getEvent('Transfer'),
    [
      createAddress(from),
      createAddress(to),
      ethers.BigNumber.from(value),
    ],
  );
}

describe('Impossible Finance token non-whitelist mint test suite', () => {
  let handler: HandleTransaction;
  let contract: ethers.utils.Interface;

  // Set the zere address
  const ZERO_ADDR = createAddress('0x0');
  // Set the IF token contract address
  const IF_ADDR = createAddress('0xa1');
  // Create addresses for the whitelist
  const WHITELIST_ADDRS: string[] = [
    createAddress('0xb1'),
    createAddress('0xb2'),
    createAddress('0xb3'),
    createAddress('0xb4')
  ];
  // Create an address outside the whitelist
  const NON_WHITELIST_ADDR = createAddress('0xc1');

  // Setup to be run before the tests
  beforeAll(() => {
    handler = provideHandleTransaction(IF_ADDR, WHITELIST_ADDRS);
    contract = new ethers.utils.Interface(IF_ABI);
  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });
  
  it('should ignore mints from other addresses', async () => {
    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, NON_WHITELIST_ADDR, ethers.BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        WHITELIST_ADDRS[0],
        log.data,
        ...log.topics
      );

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it('should ignore transfers that are not mints', async () => {
    // Generate the event log
    const log = generateTransferLog(contract, WHITELIST_ADDRS[0], NON_WHITELIST_ADDR, ethers.BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        IF_ADDR,
        log.data,
        ...log.topics
      );

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it('should ignore mints to whitelisted addresses', async () => {
    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, WHITELIST_ADDRS[0], ethers.BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        IF_ADDR,
        log.data,
        ...log.topics
      );

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it('should detect single mint to non-whitelisted address', async () => {
    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, NON_WHITELIST_ADDR, ethers.BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        IF_ADDR,
        log.data,
        ...log.topics
      );

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([
      createFinding(NON_WHITELIST_ADDR)
    ]);
  });

  it('should detect multiple mints to non-whitelisted address', async () => {
    // Generate the event log
    const log1 = generateTransferLog(contract, ZERO_ADDR, NON_WHITELIST_ADDR, ethers.BigNumber.from('100').toHexString());  
    const log2 = generateTransferLog(contract, ZERO_ADDR, NON_WHITELIST_ADDR, ethers.BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        IF_ADDR,
        log1.data,
        ...log1.topics
      )
      .addAnonymousEventLog(
        IF_ADDR,
        log2.data,
        ...log2.topics
      );

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([
      createFinding(NON_WHITELIST_ADDR),
      createFinding(NON_WHITELIST_ADDR)
    ]);
  });
});
