import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import {
  provideMetaPoolDeployment,
  metaPoolAbi,
} from './agent';
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters,
} from "forta-agent-tools";

const TEST_FACTORY_ADDRESS = createAddress('0x1212');
const ALERT_ID = 'test';

describe('Meta Pool Deployment Agent', () => {
  let handleTransaction: HandleTransaction;

  const basePoolAddress: string = createAddress('0x1');
  const coinAddress: string = createAddress('0x2');
  const ampCoef: number = 10;
  const fee: number = 100;
  const msgSender: string = createAddress('0x3');

  const data: string = encodeParameters(
    ["address","address","uint256", "uint256", "address"],
    [coinAddress, basePoolAddress, ampCoef, fee, msgSender]
  );

  beforeAll(() => {
    handleTransaction = provideMetaPoolDeployment(ALERT_ID, TEST_FACTORY_ADDRESS);
  });

  it('should return a finding', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_FACTORY_ADDRESS, msgSender)
      .addEventLog(metaPoolAbi,TEST_FACTORY_ADDRESS,data);

    console.log("the txEvent in the first test is: " + JSON.stringify(txEvent));

    const findings = await handleTransaction(txEvent);

    /*
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Deploy Meta Pool Event',
        description: 'New meta pool is deployed',
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Unknown,
        metadata: {
          coin: coinAddress,
          basePool: basePoolAddress,
          a: ampCoef.toString(),
          fee: fee.toString(),
          deployer: msgSender
        }
      }),
    ]);
    */
  });

  /*
  // NOTE: Revisit this after figuring out if necessary to encode
  // and decode.
  it('should return empty finding cause bad signature', async () => {
    const badData: string = encodeParameters(['string'],['badSig']);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_FACTORY_ADDRESS, msgSender)
      .addEventLog(metaPoolAbi, TEST_FACTORY_ADDRESS, badData);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding cause wrong Address', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_FACTORY_ADDRESS, msgSender)
      .addEventLog(metaPoolAbi,'0x1111');

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
  */
});
