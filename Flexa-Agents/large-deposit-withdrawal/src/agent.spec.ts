import { BigNumber } from "ethers";
import { formatBytes32String, Interface } from "ethers/lib/utils";
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { EVENTS_SIGNATURES } from "./utils";

const FLEXA_CONTRACT = createAddress("0xfea");
const THRESHOLD = BigNumber.from(1000); // amount threshold used by the agent
const EVENTS_IFACE = new Interface(EVENTS_SIGNATURES);
const AMOUNT_CORRECTION: BigNumber = BigNumber.from(10).pow(18);
const PRICE_CORRECTION: BigNumber = BigNumber.from(10).pow(8);
const TOKEN_PRICE = BigNumber.from(10).mul(PRICE_CORRECTION);

const createFinding = (
  logName: string,
  supplier: string,
  amount: BigNumber
): Finding => {
  const name = logName == "SupplyReceipt" ? "Deposit" : "Withdrawal";
  return Finding.fromObject({
    name: `Large ${name} detected on Flexa staking contract`,
    description: `${logName} event emitted with a large amount`,
    alertId: "FLEXA-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa",
    metadata: {
      supplier: supplier.toLowerCase(),
      amount: amount.toHexString(),
    },
  });
};

describe("Large deposit/ withdrawal agent tests suite", () => {
  //init the mock fetcher
  const mockPrice = jest.fn();
  const mockFetcher = {
    getAmpPrice: mockPrice,
  };
  mockPrice.mockReturnValue([1, TOKEN_PRICE, 2, 3, 1]);

  // init the agent
  let handler: HandleTransaction;
  handler = provideHandleTransaction(
    FLEXA_CONTRACT,
    mockFetcher as any,
    THRESHOLD
  );

  it("should ignore transactions without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events emitted on a different contract", async () => {
    const different_contract = createAddress("0xd4");
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("SupplyReceipt"),
      [
        createAddress("0xa1"), // supplier
        formatBytes32String("abc"), // partition
        BigNumber.from(150).mul(AMOUNT_CORRECTION), // amount exceeding the threshold
        5, // nonce
      ]
    );
    const log2 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Withdrawal"),
      [
        createAddress("0xa2"), // supplier
        formatBytes32String("bbe"), // partition
        BigNumber.from(160).mul(AMOUNT_CORRECTION), //amount exceeding the threshold
        5, // rootNonce
        5, // authorizedAccountNonce
      ]
    );
    const log3 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("FallbackWithdrawal"),
      [
        createAddress("0xa3"), // supplier
        formatBytes32String("ebc"), // partition
        BigNumber.from(150).mul(AMOUNT_CORRECTION), //amount exceeding the threshold
      ]
    );
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(different_contract, log1.data, ...log1.topics)
      .addAnonymousEventLog(different_contract, log2.data, ...log2.topics)
      .addAnonymousEventLog(different_contract, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings", async () => {
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("SupplyReceipt"),
      [
        createAddress("0xa1"), //supplier
        formatBytes32String("abc"), //flexa partition
        BigNumber.from(150).mul(AMOUNT_CORRECTION), //amount exceeding the threshold
        5, // nonce
      ]
    );
    const log2 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Withdrawal"),
      [
        createAddress("0xa2"), //supplier
        formatBytes32String("abc"), //flexa partition
        BigNumber.from(160).mul(AMOUNT_CORRECTION), //amount exceeding the threshold
        5, // rootNonce
        5, // authorizedAccountNonce
      ]
    );
    const log3 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("FallbackWithdrawal"),
      [
        createAddress("0xa3"), //supplier
        formatBytes32String("abc"), //flexa partition
        BigNumber.from(200).mul(AMOUNT_CORRECTION), //amount exceeding the threshold
      ]
    );
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(FLEXA_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(FLEXA_CONTRACT, log2.data, ...log2.topics)
      .addAnonymousEventLog(FLEXA_CONTRACT, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(
        "SupplyReceipt",
        createAddress("0xa1"),
        BigNumber.from(150).mul(AMOUNT_CORRECTION)
      ),
      createFinding(
        "Withdrawal",
        createAddress("0xa2"),
        BigNumber.from(160).mul(AMOUNT_CORRECTION)
      ),
      createFinding(
        "FallbackWithdrawal",
        createAddress("0xa3"),
        BigNumber.from(200).mul(AMOUNT_CORRECTION)
      ),
    ]);
  });

  it("should ignore events with a regular amount", async () => {
    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("SupplyReceipt"),
      [
        createAddress("0xa1"), //supplier
        formatBytes32String("abc"), //partition
        BigNumber.from(50).mul(AMOUNT_CORRECTION), // regular amount
        5, // nonce
      ]
    );

    const log2 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Withdrawal"),
      [
        createAddress("0xa2"), // supplier
        formatBytes32String("bbe"), // partition
        BigNumber.from(160).mul(AMOUNT_CORRECTION), // amount exceeding the threshold
        5, // rootNonce
        5, // authorizedAccountNonce
      ]
    );
    const log3 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("FallbackWithdrawal"),
      [
        createAddress("0xa3"), // supplier
        formatBytes32String("ebc"), // partition
        BigNumber.from(60).mul(AMOUNT_CORRECTION), // regular amount
      ]
    );
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(FLEXA_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(FLEXA_CONTRACT, log2.data, ...log2.topics)
      .addAnonymousEventLog(FLEXA_CONTRACT, log3.data, ...log3.topics);
    // generate a finding to only the event with an amount greater than the threshold
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(
        "Withdrawal",
        createAddress("0xa2"),
        BigNumber.from(160).mul(AMOUNT_CORRECTION)
      ),
    ]);
  });
});
