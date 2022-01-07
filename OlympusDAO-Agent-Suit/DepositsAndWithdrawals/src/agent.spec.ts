import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { 
  createAddress, 
  TestTransactionEvent, 
  encodeParameter 
} from "forta-agent-tools";
import { BigNumber } from "ethers";
import utils from "./utils";

const depositFinding = (token: string, amount: number, value: number): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury High tokens movement detected",
  description: "High Deposit",
  alertId: "olympus-treasury-5-1",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "OlympusDAO",
  metadata: {
    token,
    amount: amount.toString(),
    value: value.toString(),
  }
});

const withdrawalFinding = (token: string, amount: number, value: number): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury High tokens movement detected",
  description: "High Withdrawal",
  alertId: "olympus-treasury-5-2",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "OlympusDAO",
  metadata: {
    token,
    amount: amount.toString(),
    value: value.toString(),
  }
});

describe("Ownership Transfers Test Suite", () => {
  const treasury: string = createAddress("0xdead");
  const handler: HandleTransaction = provideHandleTransaction(treasury, BigNumber.from(500));

  it("should ignore transactions not emitting events", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions not emitting the correct event", async () => {
    const event = utils.TEST_IFACE.getEvent("TestEvent");
    const log = utils.TEST_IFACE.encodeEventLog(event, [
      createAddress("0xDA0"),
      5000,
      50000,
    ]);

    const tx: TransactionEvent =  new TestTransactionEvent()
      .addEventLog(
        event.format("sighash"),
        treasury,
        log.data,
        ...log.topics.slice(1),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions emitting the correct event in the wrong contract", async () => {
    const event = utils.TEST_IFACE.getEvent("Deposit");
    const log = utils.TEST_IFACE.encodeEventLog(event, [
      createAddress("0xc0de"),
      5000,
      50000,
    ]);
    
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addEventLog(
        event.format("sighash"),
        createAddress('0xbee'),
        log.data,
        ...log.topics.slice(1),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect high token movements", async () => {
    const deposit = utils.TEST_IFACE.getEvent("Deposit");
    const withdraw = utils.TEST_IFACE.getEvent("Withdrawal");
    const params: [string, number, number][] = [
      [createAddress("0xc0de1"), 20, 200],
      [createAddress("0xc0de2"), 4, 510],
      [createAddress("0xc0de3"), 10000, 1],
      [createAddress("0xc0de4"), 200, 100000],
      [createAddress("0xc0de5"), 1, 3000],
    ]
    
    const expectedFindings: Finding[] = []
    const tx: TestTransactionEvent =  new TestTransactionEvent();
    
    for(let [token, amount, value] of params){
      const depositLog = utils.TEST_IFACE.encodeEventLog(deposit, [token, amount, value]);
      const withdrawLog = utils.TEST_IFACE.encodeEventLog(withdraw, [token, amount, value]);
      tx
        .addEventLog(
          deposit.format("sighash"), 
          treasury, 
          depositLog.data, 
          ...depositLog.topics.slice(1),
        )
        .addEventLog(
          withdraw.format("sighash"), 
          treasury, 
          withdrawLog.data, 
          ...withdrawLog.topics.slice(1),
        )
      if(value > 500){
        expectedFindings.push(
          depositFinding(token, amount, value),
          withdrawalFinding(token, amount, value),
        )
      }
    }

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual(expectedFindings);
  });
});