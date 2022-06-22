import { BigNumber, utils } from "ethers";
import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { PURCHASE_ABI, STAKE_ABI, UNSTAKE_ABI, WITHDRAW_ABI } from "./utils";

const STAKE_IFACE: utils.Interface = new utils.Interface([STAKE_ABI, UNSTAKE_ABI]);
const SALE_IFACE: utils.Interface = new utils.Interface([PURCHASE_ABI, WITHDRAW_ABI]);

// Address declarations
const STAKING_ADDRESS: string = createAddress("0xa0");
const SALE_ADDRESSES: string[] = [
  createAddress("0xb0"),
  createAddress("0xb1"),
  createAddress("0xc1"),
  createAddress("0xd1"),
];

const promise = (value: number) => new Promise((resolve) => resolve(BigNumber.from(value)));

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

const saleFinding = (saleContract: string, name: string, amount: string, from: string): Finding =>
  Finding.fromObject({
    name: `Large ${name} detected.`,
    description: `${name}() event emitted with a large amount`,
    alertId: "IMPOSSIBLE-4-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      saleContract,
      from,
      amount,
    },
  });

describe("Large Deposits-withdraws Agent test suite", () => {
  const mockGetTotalSupply = jest.fn();
  const mockGetTotalPaymentReceived = jest.fn();
  const mockStakeFetcher = {
    getTotalSupply: mockGetTotalSupply,
  };
  const mockSaleFetcher = {
    getTotalPaymentReceived: mockGetTotalPaymentReceived,
  };

  const handler: HandleTransaction = provideHandleTransaction(
    STAKING_ADDRESS,
    SALE_ADDRESSES,
    mockStakeFetcher as any,
    mockSaleFetcher as any
  );

  beforeEach(() => {
    mockGetTotalSupply.mockClear();
    mockGetTotalPaymentReceived.mockClear();
  });

  it("should return empty findings if no events emitted", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events from other contracts", async () => {
    const log1 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Stake"), [11, createAddress("0xa2"), 40]);
    const log2 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Unstake"), ["11", createAddress("0xa3"), "60"]);
    const log3 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Purchase"), [createAddress("0xa4"), "80"]);

    const log4 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Withdraw"), [createAddress("0xa6"), "90"]);

    const tx: TransactionEvent = new TestTransactionEvent()
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
    const log1 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Stake"), ["11", createAddress("0xa2"), "40"]);
    const log2 = STAKE_IFACE.encodeEventLog(STAKE_IFACE.getEvent("Unstake"), ["11", createAddress("0xa3"), "60"]);
    const log3 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Purchase"), [createAddress("0xa4"), "80"]);

    const log4 = SALE_IFACE.encodeEventLog(SALE_IFACE.getEvent("Withdraw"), [createAddress("0xa6"), "90"]);

    mockGetTotalSupply.mockReturnValueOnce(promise(100)).mockReturnValueOnce(promise(120));
    mockGetTotalPaymentReceived.mockReturnValueOnce(promise(100)).mockReturnValueOnce(promise(80));

    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(532188)
      .addAnonymousEventLog(STAKING_ADDRESS, log1.data, ...log1.topics)
      .addAnonymousEventLog(STAKING_ADDRESS, log2.data, ...log2.topics)
      .addAnonymousEventLog(SALE_ADDRESSES[0], log3.data, ...log3.topics)
      .addAnonymousEventLog(SALE_ADDRESSES[1], log4.data, ...log4.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      stakeFinding("Stake", "40", createAddress("0xa2")),
      stakeFinding("Unstake", "60", createAddress("0xa3")),
      saleFinding(SALE_ADDRESSES[0], "Purchase", "80", createAddress("0xa4")),
      saleFinding(SALE_ADDRESSES[1], "Withdraw", "90", createAddress("0xa6")),
    ]);
  });
});
