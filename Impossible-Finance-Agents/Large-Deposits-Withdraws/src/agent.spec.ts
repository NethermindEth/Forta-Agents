import { BigNumber, utils } from "ethers";
import { Interface } from "ethers/lib/utils";
import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import SalesFetcher from "./sales.fetcher";
import StakeFetcher from "./stake.fetcher";
import {
  PURCHASE_ABI,
  SALE_ABI,
  STAKE_ABI,
  SUPPLY_ABI,
  UNSTAKE_ABI,
  WITHDRAW_ABI,
} from "./utils";

const STAKE_IFACE: utils.Interface = new utils.Interface([
  STAKE_ABI,
  UNSTAKE_ABI,
]);
const SALE_IFACE: utils.Interface = new utils.Interface([
  PURCHASE_ABI,
  WITHDRAW_ABI,
]);

// Address declarations
const STAKING_ADDRESS: string = createAddress("0xa0");
const SALE_ADDRESSES: string[] = [
  createAddress("0xb0"),
  createAddress("0xb1"),
  createAddress("0xc1"),
  createAddress("0xd1"),
];
const TEST_BLOCK = 50;

const TEST_DATA = [
  [
    "11",
    createAddress("0xa2"),
    "40",
  ], // Stack below threshold
  [
    "11",
    createAddress("0xa3"),
    "60",
  ], //Unstake below threshold
  [
    createAddress("0xa4"),
    "120",
  ], // Purchase below threshold
  [
    createAddress("0xa6"),
    "140",
  ],// Withdraw below threshold
  [
    "11",
    createAddress("0xa2"),
    "120",
  ], // Stack above threshold
  [
    "11",
    createAddress("0xa3"),
    "140",
  ], //Unstake above threshold
  [
    createAddress("0xa4"),
    "250",
  ], // Purchase above threshold
  [
    createAddress("0xa6"),
    "300",
  ] // Withdraw above threshold

]
const promise = (value: number) =>
  new Promise((resolve) => resolve(BigNumber.from(value)));

const stakeFinding = (name: string, amount: string, from: string): Finding =>
  Finding.fromObject({
    name: `Large ${name} detected on staking contract.`,
    description: `${name}() event emitted with a large amount`,
    alertId: "IMPOSSIBLE-4-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      from,
      amount,
    },
  });

const saleFinding = (
  sale_contract: string,
  name: string,
  amount: string,
  from: string
): Finding =>
  Finding.fromObject({
    name: `Large ${name} detected.`,
    description: `${name}() event emitted with a large amount`,
    alertId: "IMPOSSIBLE-4-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      sale_contract,
      from,
      amount,
    },
  });

describe("Large Deposits-withdraws test suite", () => {

  const mockProvider = new MockEthersProvider();

  const handler: HandleTransaction = provideHandleTransaction(
   new StakeFetcher(mockProvider as any, STAKING_ADDRESS),
   new SalesFetcher(mockProvider as any, SALE_ADDRESSES)
  );

  beforeAll(() => {
    mockProvider.addCallTo(STAKING_ADDRESS,TEST_BLOCK -1, new Interface(SUPPLY_ABI),"totalSupply",{
      inputs:[],
      outputs:[BigNumber.from(1000)]
    })

    for (let saleContract of SALE_ADDRESSES){
      mockProvider.addCallTo(saleContract,TEST_BLOCK -1, new Interface(SALE_ABI),"totalPaymentReceived",{
        inputs:[],
        outputs:[BigNumber.from(2000)]
      })
    }
  });

  it("should return empty findings if no events emitted", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events from other contracts", async () => {
    const log1 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Stake"), TEST_DATA[4]);
    const log2 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Unstake"), TEST_DATA[5]);
    const log3 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Purchase"), TEST_DATA[6]);
    const log4 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Withdraw"), TEST_DATA[7]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(
        createAddress("0xd4"), //contract addresss
        log1.data,
        ...log1.topics
      )
      .addAnonymousEventLog(
        createAddress("0xd4"), //contract addresss
        log2.data,
        ...log2.topics
      )
      .addAnonymousEventLog(
        createAddress("0xd4"), //contract addresss
        log3.data,
        ...log3.topics
      )
      .addAnonymousEventLog(
        createAddress("0xd4"), //contract addresss
        log4.data,
        ...log4.topics
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect multiple events from the contract", async () => {
    // below threshold
    const log1 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Stake"), TEST_DATA[0]);
    const log2 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Unstake"), TEST_DATA[1]);
    const log3 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Purchase"), TEST_DATA[2]);
    const log4 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Withdraw"), TEST_DATA[3]);
    // above threshold
    const log5 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Stake"), TEST_DATA[4]);
    const log6 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Unstake"), TEST_DATA[5]);
    const log7 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Purchase"), TEST_DATA[6]);
    const log8 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Withdraw"), TEST_DATA[7]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(STAKING_ADDRESS, log1.data, ...log1.topics)
      .addAnonymousEventLog(STAKING_ADDRESS, log2.data, ...log2.topics)
      .addAnonymousEventLog(SALE_ADDRESSES[0], log3.data, ...log3.topics)
      .addAnonymousEventLog(SALE_ADDRESSES[1], log4.data, ...log4.topics)
      .addAnonymousEventLog(STAKING_ADDRESS, log5.data, ...log5.topics)
      .addAnonymousEventLog(STAKING_ADDRESS, log6.data, ...log6.topics)
      .addAnonymousEventLog(SALE_ADDRESSES[2], log7.data, ...log7.topics)
      .addAnonymousEventLog(SALE_ADDRESSES[1], log8.data, ...log8.topics);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([
      stakeFinding("Stake",TEST_DATA[4][2], TEST_DATA[4][1]),
      stakeFinding("Unstake", TEST_DATA[5][2], TEST_DATA[5][1]),
      saleFinding(SALE_ADDRESSES[2], "Purchase", TEST_DATA[6][1], TEST_DATA[6][0]),
      saleFinding(SALE_ADDRESSES[1], "Withdraw",TEST_DATA[7][1], TEST_DATA[7][0]),
    ]);
  });
});
