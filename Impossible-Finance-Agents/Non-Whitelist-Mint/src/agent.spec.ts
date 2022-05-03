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
  BigNumber,
  ethers
} from 'ethers';

import {
  Verifier,
} from './verifier';

// Function to easily create a finding
const createFinding = (receiver: string) => Finding.fromObject({
  name: 'IF token non-whitelist mint',
  description: 'IF tokens have been minted to a non-whitelisted address',
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
      BigNumber.from(value),
    ],
  );
}

describe('Impossible Finance token non-whitelist mint test suite', () => {
  let handler: HandleTransaction;
  let contract: ethers.utils.Interface;
  let tokens: [string, Verifier, string, string][];
  let mockedVerifier_IF: any;
  let mockedVerifier_IDIA: any;

  // Set the zere address
  const ZERO_ADDR = createAddress('0x0');
  // Set the IF and IDIA token contract address
  const IF_ADDR = createAddress('0xa1');
  const IDIA_ADDR = createAddress('0xa2');
  // Set address of another token that is not IF or IDIA
  const IRRELEVANT_ADDR = createAddress('0xb1');
  // Set a user address
  const USER_ADDR = createAddress('0xc1');

  // Setup to be run before the tests
  beforeAll(() => {
    // Setup the ethers interface
    contract = new ethers.utils.Interface(IF_ABI);
    // Setup the mock functions for the verifiers
    mockedVerifier_IF = jest.fn();
    mockedVerifier_IDIA = jest.fn();
    // Construct the `tokens` array to be passed to the handler with mock verifiers
    tokens = [
      [
        IF_ADDR,
        mockedVerifier_IF,
        'IF',
        'IMPOSSIBLE-2-1'
      ],
      [
        IDIA_ADDR,
        mockedVerifier_IDIA,
        'IDIA',
        'IMPOSSBILE-2-2'
      ]
    ];
    // Get the agent handler
    handler = provideHandleTransaction(tokens);
  });

  beforeEach(() => {
    jest.resetAllMocks();
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
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        IRRELEVANT_ADDR,
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
    const log = generateTransferLog(contract, IRRELEVANT_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  

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
    // Mock the IF verifier to state that `USER_ADDR` is a whitelisted address
    mockedVerifier_IF.mockResolvedValue(true);

    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  

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

  it('should ignore mints through calls to `staxMigrate`', async () => {
    // Mock the IF verifier to state that `USER_ADDR` is a whitelisted address
    mockedVerifier_IF.mockResolvedValue(false);

    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData(
          'staxMigrate',
          [
            BigNumber.from('100')
          ]
        ),
        output: '0x0'
      })
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
    // Mock the IF verifier to state that `USER_ADDR` is not a whitelisted address
    mockedVerifier_IF.mockResolvedValue(false);

    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  

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
      createFinding(USER_ADDR)
    ]);
  });

  it('should detect multiple mints to non-whitelisted address', async () => {
    // Mock the IF verifier twice to state that `USER_ADDR` is a whitelisted address
    mockedVerifier_IF.mockResolvedValue(false);
    mockedVerifier_IF.mockResolvedValue(false);
    
    // Generate the event log
    const log1 = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  
    const log2 = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from('100').toHexString());  

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
      createFinding(USER_ADDR),
      createFinding(USER_ADDR)
    ]);
  });
});
