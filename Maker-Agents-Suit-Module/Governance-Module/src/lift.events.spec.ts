import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  Log,
  createTransactionEvent,
  Receipt,
  Transaction,
  Block,
} from 'forta-agent';
import { 
  createFinding, 
  provideLiftEventsListener as provider,
} from './lift.events';
import { 
  Set, 
  argsToSet, 
  AddressVerifier,
  createAddr,
  createEncodedAddr,
} from './utils';

const alertId: string = "Test Finding";
const contract: string = createAddr("0xA");
const contractInLower: string = contract.toLowerCase();
const topic: string = createEncodedAddr("0xFF");
const addresses: Set = argsToSet(
  createAddr("0xb"), 
  createAddr("0xc"), 
  createAddr("0xd"),
);
const isKnown: AddressVerifier = async (addr: string): Promise<boolean> => 
  (addresses[addr] !== undefined);

const createLog = (address: string, ...topics: string[]): Log => {
  return {
    address: address,
    topics: topics,
  } as Log;
};

const createTxEvent = (addresses: Set, ...logs: Log[]): TransactionEvent => 
  createTransactionEvent({
    receipt: {
      logs: logs,
    } as Receipt,
    transaction: {} as Transaction,
    block: {} as Block,
    addresses: addresses,
  });

describe('Lift Events listener test suite', () => {
  const handleTransaction: HandleTransaction = provider(alertId, contract, isKnown, topic)

  it('Should return 0 findings if the contract is not involve in the tx', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr('0x1'), createAddr('0x2')),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it('Should return 0 findings if the event is not emited by the address', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr('0x1'), createAddr('0x2'), createAddr(contract)),
      createLog(createAddr('0x1'), createEncodedAddr('0x11'), createEncodedAddr('0x123')),
      createLog(createAddr('0x2'), topic, createEncodedAddr('0x456'), createEncodedAddr('0x20')),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it('Should return 0 findings if the address are known', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr('0x1'), createAddr('0x2'), contractInLower),
      createLog(contractInLower, topic, createEncodedAddr('0xb'), createEncodedAddr('0xc')),
      createLog(contractInLower, topic, createEncodedAddr('0xd'), createEncodedAddr('0xb')),
      createLog(contractInLower, topic, createEncodedAddr('0xc'), createEncodedAddr('0xd')),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it('Should detect unknown addresses in the event', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr('0x1'), createAddr('0x2'), contractInLower),
      createLog(contractInLower, topic, createEncodedAddr('0xB'),  createEncodedAddr('0xC1')),
      createLog(contractInLower, topic, createEncodedAddr('0xD2'), createEncodedAddr('0xB')),
      createLog(contractInLower, topic, createEncodedAddr('0xC3'), createEncodedAddr('0xD3')),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, createAddr('0xc1'), 2),
      createFinding(alertId, createAddr('0xd2'), 1),
      createFinding(alertId, createAddr('0xc3'), 1),
      createFinding(alertId, createAddr('0xd3'), 2),
    ]);
  });
});
