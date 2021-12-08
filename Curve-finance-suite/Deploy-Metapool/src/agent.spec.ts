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
  encodeEventSignature
} from "forta-agent-tools";

const TEST_FACTORY_ADDRESS = createAddress('0x1212');
const ALERT_ID = 'test';

/*
const encodedEventSig: string = encodeEventSignature(
  'MetaPoolDeployed(address,address,uint256,uint256,address)'
);
*/

const eventSig: string = 'MetaPoolDeployed(address,address,uint256,uint256,address)';

describe('Meta Pool Deployment Agent', () => {
  let handleTransaction: HandleTransaction;

  const basePoolAddress: string = createAddress('0x1');
  const coinAddress: string = createAddress('0x2');
  const ampCoef: number = 10;
  const fee: number = 100;
  const deployer: string = createAddress('0x3');

  const data: string = encodeParameters(
    ["address","address","uint256", "uint256", "address"],
    [coinAddress, basePoolAddress, ampCoef, fee, deployer]
  );

  beforeAll(() => {
    handleTransaction = provideMetaPoolDeployment(ALERT_ID, TEST_FACTORY_ADDRESS);
  });

  it('should return a finding', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(deployer)
      .setTo(TEST_FACTORY_ADDRESS)
      //.setData(data)
      //.addInvolvedAddresses(TEST_FACTORY_ADDRESS, msgSender)
      .addEventLog(eventSig, TEST_FACTORY_ADDRESS, data);

    console.log("The texEvent passed into the handler is: " + JSON.stringify(txEvent));

    const findings = await handleTransaction(txEvent);

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
          deployer: deployer
        }
      }),
    ]);
  });

  // NOTE: Revisit this after figuring out if necessary to encode
  // and decode.
  it('should return empty finding cause bad signature', async () => {
    const badData: string = encodeParameters(['string'],['badSig']);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_FACTORY_ADDRESS, deployer)
      .addEventLog(metaPoolAbi, TEST_FACTORY_ADDRESS, badData);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding cause wrong Address', async () => {
    const wrongContractAddress: string = createAddress('0x1111');

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongContractAddress, deployer)
      .addEventLog(metaPoolAbi,wrongContractAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
