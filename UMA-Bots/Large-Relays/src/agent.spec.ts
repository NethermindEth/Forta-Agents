import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { FILLED_RELAY_EVENT } from "./utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";
import { BigNumber } from "ethers";

// TEST DATA
const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54"), createAddress("0x43"), createAddress("0x47")];
const RANDOM_INTEGERS = ["120", "100", "100", "42161", "1", "1", "2", "2", "2", "3215"];
const RANDOM_EVENT_ABI = "event Transfer(address,uint)";
const TEST_SPOKEPOOL_ADDR: string = createAddress("0x23");
const MOCK_ERC20_ADDR = createAddress("0x39");
const MOCK_ERC20_ADDR_2 = createAddress("0x39");
const MOCK_THRESHOLD_ERC20: BigNumber = BigNumber.from("1000000000000000000");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: {
    spokePoolAddr: TEST_SPOKEPOOL_ADDR,
    tokenThresholds: {
      [MOCK_ERC20_ADDR]: MOCK_THRESHOLD_ERC20.toString(), // 1e18
      [MOCK_ERC20_ADDR_2]: MOCK_THRESHOLD_ERC20.toString(), // 1e18
    },
  },
};
const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);

// Finding generating function and parameters
const passParams = (_amount: string, _destinationToken: string) => {
  return [
    _amount,
    RANDOM_INTEGERS[1],
    RANDOM_INTEGERS[2],
    RANDOM_INTEGERS[3],
    RANDOM_INTEGERS[4],
    RANDOM_INTEGERS[5],
    RANDOM_INTEGERS[6],
    RANDOM_INTEGERS[7],
    RANDOM_INTEGERS[8],
    RANDOM_INTEGERS[9],
    _destinationToken,
    RANDOM_ADDRESSES[1],
    RANDOM_ADDRESSES[2],
    RANDOM_ADDRESSES[3],
    false,
  ];
};

function testGetFindingInstance(
  amount: string,
  destinationToken: string,
  originChainId: string,
  destinationChainId: string,
  depositor: string,
  recipient: string,
  isSlowRelay: string
) {
  return Finding.fromObject({
    name: "Large Relay Filled",
    description: "A large amount of funds was transferred via the Across v2 SpokePool",
    alertId: "UMA-7",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      amount,
      destinationToken,
      originChainId,
      destinationChainId,
      depositor,
      recipient,
      isSlowRelay,
    },
  });
}

const expectedFinding = (_amount: string, _destinationToken: string) => {
  return testGetFindingInstance(
    _amount,
    _destinationToken,
    RANDOM_INTEGERS[4],
    RANDOM_INTEGERS[5],
    RANDOM_ADDRESSES[2],
    RANDOM_ADDRESSES[3],
    "false"
  );
};

// Test cases
describe("Large relay detection bot test suite", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(FILLED_RELAY_EVENT, networkManagerTest);

  it("returns empty findings if there is no event emitted", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a large amount of specified tokens are bridged via a contract other than the official SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(
        FILLED_RELAY_EVENT,
        RANDOM_ADDRESSES[0],
        passParams(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR)
      );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if an irrelevant event is emitted from the SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(RANDOM_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "120"]);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a small (less than threshold) amount of non-specified tokens are bridged via official SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams("21", RANDOM_ADDRESSES[2]));
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a small (less than threshold) amount of specified tokens are bridged via official SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams("21", MOCK_ERC20_ADDR));
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a large amount of non-specified tokens are bridged via official SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(
        FILLED_RELAY_EVENT,
        TEST_SPOKEPOOL_ADDR,
        passParams(MOCK_THRESHOLD_ERC20.toString(), RANDOM_ADDRESSES[0])
      );
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a large amount of specified tokens are bridged via official SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(
        FILLED_RELAY_EVENT,
        TEST_SPOKEPOOL_ADDR,
        passParams(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR)
      );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([expectedFinding(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR)]);
  });

  it("returns N findings when N large relays occurs from the official SpokePool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(
        FILLED_RELAY_EVENT,
        TEST_SPOKEPOOL_ADDR,
        passParams(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR)
      )
      .addEventLog(
        FILLED_RELAY_EVENT,
        TEST_SPOKEPOOL_ADDR,
        passParams(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR_2)
      )
      .addEventLog(RANDOM_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "120"]) // Irrelavant events emitted from the official SpokePool must be ignored
      .addEventLog(
        FILLED_RELAY_EVENT,
        TEST_SPOKEPOOL_ADDR,
        passParams(MOCK_THRESHOLD_ERC20.sub(BigNumber.from("1")).toString(), MOCK_ERC20_ADDR_2)
      ); // Amounts of tokens less than threshold shall not be in the findings

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      expectedFinding(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR),
      expectedFinding(MOCK_THRESHOLD_ERC20.toString(), MOCK_ERC20_ADDR_2),
    ]);
  });
});
