import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { TRANSFER_EVENT } from "./utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";
import LRU from "lru-cache";
import { BigNumber } from "ethers";

const TEST_MONITORED_ADDRESS = createAddress("0x07");
const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54"), createAddress("0x43"), createAddress("0x47")];
const RANDOM_INTEGERS = ["120"];
const RANDOM_EVENT_ABI = "event Send()";
const MONITORED_ERC20_ADDR = createAddress("0x39");
const MONITORED_ERC20_ADDR_2 = createAddress("0x55");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: {
    monitoredTokens: [MONITORED_ERC20_ADDR, MONITORED_ERC20_ADDR_2],
    monitoredAddresses: [TEST_MONITORED_ADDRESS],
    alertThreshold: 50,
  },
};
const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);
const testLru = new LRU<string, Record<string, BigNumber>>({ max: 10000 }); // token address => { wallet address => balance }
function testGetFindingInstance(amount: string, walletAddr: string, tokenAddr: string, fundsIn: string) {
  return Finding.fromObject({
    name: "Large relayer tokens balance change",
    description: "A large amount of funds was transferred from a monitored relayer address",
    alertId: "UMA-9",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      amount,
      walletAddr,
      tokenAddr,
      fundsIn,
    },
  });
}

// Test cases
describe("Large relay detection bot test suite", () => {
  let handleTransaction: HandleTransaction;
  beforeEach(() => {
    testLru.set(MONITORED_ERC20_ADDR, { [TEST_MONITORED_ADDRESS]: BigNumber.from(0) });
    testLru.set(MONITORED_ERC20_ADDR_2, { [TEST_MONITORED_ADDRESS]: BigNumber.from(0) });
    handleTransaction = provideHandleTransaction(TRANSFER_EVENT, networkManagerTest, testLru);
  });

  it("returns empty findings if there is no event emitted", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a transfer is detected from non-monitored address for a non-monitored token", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(TRANSFER_EVENT, RANDOM_ADDRESSES[0], [RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], RANDOM_INTEGERS[0]]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding for non-transfer events", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(RANDOM_EVENT_ABI, RANDOM_ADDRESSES[0], []);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a transfer is detected from a monitored address for a non-monitored token", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(TRANSFER_EVENT, RANDOM_ADDRESSES[0], [
        TEST_MONITORED_ADDRESS,
        RANDOM_ADDRESSES[1],
        RANDOM_INTEGERS[0],
      ]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a transfer is detected from a non-monitored address for a monitored token", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        RANDOM_INTEGERS[0],
      ]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a monitored address acquires monitored tokens with initial zero balance", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR, [RANDOM_ADDRESSES[0], TEST_MONITORED_ADDRESS, "1000000"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testGetFindingInstance("1000000", TEST_MONITORED_ADDRESS, MONITORED_ERC20_ADDR, "true"),
    ]);
  });

  it("returns a finding if a monitored address receives a large (more than 50% change) amount of tokens", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR, [RANDOM_ADDRESSES[0], TEST_MONITORED_ADDRESS, "500000"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testGetFindingInstance("500000", TEST_MONITORED_ADDRESS, MONITORED_ERC20_ADDR, "true"),
    ]);
  });

  it("returns a finding if a monitored address sends a large (more than 50% change) amount of tokens", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR, [TEST_MONITORED_ADDRESS, RANDOM_ADDRESSES[0], "1000000"]);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testGetFindingInstance("1000000", TEST_MONITORED_ADDRESS, MONITORED_ERC20_ADDR, "false"),
    ]);
  });

  it("returns N finding only for those transactions that cross the percentage threshold (for monitored address and monitored token) when N > 1", async () => {
    // current balance in testLru for MONITORED_ERC20_ADDR TEST_MONITORED_ADDRESS is 1500000
    testLru.set(MONITORED_ERC20_ADDR, { [TEST_MONITORED_ADDRESS]: BigNumber.from(1500000) });
    testLru.set(MONITORED_ERC20_ADDR_2, { [TEST_MONITORED_ADDRESS]: BigNumber.from(0) });
    handleTransaction = provideHandleTransaction(TRANSFER_EVENT, networkManagerTest, testLru);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR, [TEST_MONITORED_ADDRESS, RANDOM_ADDRESSES[0], "1000000"])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR_2, [RANDOM_ADDRESSES[0], TEST_MONITORED_ADDRESS, "1000000"])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR_2, [TEST_MONITORED_ADDRESS, RANDOM_ADDRESSES[0], "700000"])
      .addEventLog(TRANSFER_EVENT, MONITORED_ERC20_ADDR, [TEST_MONITORED_ADDRESS, RANDOM_ADDRESSES[0], "50000"]) // should not be returned in findings as it is less than 50% change
      .addEventLog(TRANSFER_EVENT, RANDOM_ADDRESSES[0], [TEST_MONITORED_ADDRESS, RANDOM_ADDRESSES[0], "1000000"]); // should not be returned in findings since the token address is not monitored
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testGetFindingInstance("1000000", TEST_MONITORED_ADDRESS, MONITORED_ERC20_ADDR, "false"),
      testGetFindingInstance("1000000", TEST_MONITORED_ADDRESS, MONITORED_ERC20_ADDR_2, "true"),
      testGetFindingInstance("700000", TEST_MONITORED_ADDRESS, MONITORED_ERC20_ADDR_2, "false"),
    ]);
  });
});
