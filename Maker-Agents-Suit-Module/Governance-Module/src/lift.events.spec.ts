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
} from './utils';

const alertId: string = "Test Finding";
const contract: string = "0xA";
const contractInLower: string = contract.toLowerCase();
const topic: string = "0xFF";
const addresses: Set = argsToSet("0xB", "0xC", "0xD");
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
      argsToSet('0x1', '0x2'),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it('Should return 0 findings if the event is not emited by the address', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet('0x1', '0x2', contractInLower),
      createLog('0xE', '0x11', '0x123'),
      createLog('0xE', topic, '0x456', '0xCAFE'),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it('Should return 0 findings if the address are known', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet('0x1', '0x2', contractInLower),
      createLog(contractInLower, topic, '0xB', '0xC'),
      createLog(contractInLower, topic, '0xD', '0xB'),
      createLog(contractInLower, topic, '0xC', '0xD'),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it('Should detect unknown addresses in the event', async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet('0x1', '0x2', contractInLower),
      createLog(contractInLower, topic, '0xB', '0xC1'),
      createLog(contractInLower, topic, '0xD2', '0xB'),
      createLog(contractInLower, topic, '0xC3', '0xD3'),
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, '0xC1', 2),
      createFinding(alertId, '0xD2', 1),
      createFinding(alertId, '0xC3', 1),
      createFinding(alertId, '0xD3', 2),
    ]);
  });
});
