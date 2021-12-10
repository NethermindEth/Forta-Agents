import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import { provideMetaPoolDeployment } from './agent';
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters
} from "forta-agent-tools";

const TEST_FACTORY_ADDRESS = createAddress('0x1212');
const ALERT_ID = 'test';

const eventSig: string = 'MetaPoolDeployed(address,address,uint256,uint256,address)';

const coinAddress: string = createAddress('0x2');
const basePoolAddress: string = createAddress('0x1');
const ampCoef: number = 10;
const fee: number = 100;
const deployer: string = createAddress('0x3');

const data: string = encodeParameters(
  ["address","address","uint256", "uint256", "address"],
  [coinAddress, basePoolAddress, ampCoef, fee, deployer]
);

describe('Meta Pool Deployment Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideMetaPoolDeployment(ALERT_ID, TEST_FACTORY_ADDRESS);
  });

  it('should return a Finding from MetaPoolDeployed emission', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(deployer)
      .setTo(TEST_FACTORY_ADDRESS)
      .addEventLog(eventSig, TEST_FACTORY_ADDRESS, data);

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
          deployer
        }
      }),
    ]);
  });

  it('should return no Findings due to incorrect event signature', async () => {
    const badSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_FACTORY_ADDRESS, deployer)
      .addEventLog(badSig, TEST_FACTORY_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return no Findings due to wrong contract ddress', async () => {
    const wrongContractAddress: string = createAddress('0x1111');

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongContractAddress, deployer)
      .addEventLog(eventSig,wrongContractAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
