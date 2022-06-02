import BigNumber from "bignumber.js";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent, ethers } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { WITHDRAW_ABI, DEPOSIT_ABI } from "./constants";
import { AgentConfig, ethersBnToBn } from "./utils";

const TEST_CONFIG: AgentConfig = {
  // threshold in USD
  threshold: "2000000",

  // Chainlink feed for the ETH-USD pair
  ethUsdFeedAddress: createAddress("0xeth"),

  // Address of the LendingPool contract
  lendingPoolAddress: createAddress("0xlp"),

  // Address of the Umee Oracle contract
  umeeOracleAddress: createAddress("0xorc"),
};

const EVENTS_IFACE = new Interface([WITHDRAW_ABI, DEPOSIT_ABI]);

const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)",
]);

const ETH_PRICE = ethersBnToBn(ethers.BigNumber.from("200000000000"), 8);
const ASSET_PRICE = ethersBnToBn(ethers.BigNumber.from("410000000000000000"), 18);

const calculateValueInUsd = (assetPrice: BigNumber, ethPrice: BigNumber, amount: ethers.BigNumber) => {
  return assetPrice.times(ethPrice).times(ethersBnToBn(amount, 6)).toString();
};

const createFinding = (logDesc: any, valueInUsd: string) => {
  const alertId: string = logDesc.name == "Deposit" ? "UMEE-8-1" : "UMEE-8-2";
  const reserve: string = logDesc.args.reserve;
  const user: string = logDesc.args.user;

  return Finding.from({
    alertId,
    name: `Large ${logDesc.name}`,
    description: `A large ${logDesc.name} has occured in the lending pool contract`,
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Umee",
    metadata: {
      user,
      reserve,
      valueInUsd,
    },
  });
};

describe("Large deposit/ withdrawal agent tests suite", () => {
  //init the mock fetcher
  const mockFetcher = {
    getEthPrice: jest.fn(),
    getAssetPrice: jest.fn(),
  };
  mockFetcher.getEthPrice.mockReturnValue(ETH_PRICE);
  mockFetcher.getAssetPrice.mockReturnValue(ASSET_PRICE);

  // init the agent
  let handler: HandleTransaction;
  handler = provideHandleTransaction(mockFetcher as any, TEST_CONFIG);

  it("should ignore transactions without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on the same contract", async () => {
    const log1 = IRRELEVANT_EVENT_IFACE.encodeEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), [
      createAddress("0x1"), // reserve
      createAddress("0x2"), // user
      createAddress("0x3"), // onBehalfOf
      ethers.BigNumber.from("4000000000"), // amount exceeding the threshold
      5, // referral
    ]);

    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      TEST_CONFIG.lendingPoolAddress,
      log1.data,
      ...log1.topics
    );

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore events emitted on a different contract", async () => {
    const different_contract = createAddress("0xd4");
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("Deposit"), [
      createAddress("0x1"), // reserve
      createAddress("0x2"), // user
      createAddress("0x3"), // onBehalfOf
      ethers.BigNumber.from("4000000000"), // amount exceeding the threshold
      5, // referral
    ]);

    const log2 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("Withdraw"), [
      createAddress("0x4"), // reserve
      createAddress("0x5"), // user
      createAddress("0x6"), // to
      ethers.BigNumber.from("5000000000"), // amount exceeding the threshold
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(different_contract, log1.data, ...log1.topics)
      .addAnonymousEventLog(different_contract, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings when both deposit and withdrawal exceed threshold", async () => {
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("Deposit"), [
      createAddress("0x1"), // reserve
      createAddress("0x2"), // user
      createAddress("0x3"), // onBehalfOf
      ethers.BigNumber.from("4000000000"), // amount exceeding the threshold
      5, // referral
    ]);

    const log2 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("Withdraw"), [
      createAddress("0x4"), // reserve
      createAddress("0x5"), // user
      createAddress("0x6"), // to
      ethers.BigNumber.from("5000000000"), // amount exceeding the threshold
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_CONFIG.lendingPoolAddress, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_CONFIG.lendingPoolAddress, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding(
        EVENTS_IFACE.parseLog(log1),
        calculateValueInUsd(ASSET_PRICE, ETH_PRICE, ethers.BigNumber.from("4000000000"))
      ),
      createFinding(
        EVENTS_IFACE.parseLog(log2),
        calculateValueInUsd(ASSET_PRICE, ETH_PRICE, ethers.BigNumber.from("5000000000"))
      ),
    ]);
  });

  it("shouldn ignore when the value in USD doesn't exceed threshold", async () => {
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("Deposit"), [
      createAddress("0x1"), // reserve
      createAddress("0x2"), // user
      createAddress("0x3"), // onBehalfOf
      ethers.BigNumber.from("1000000000"), // amount exceeding the threshold
      5, // referral
    ]);

    const log2 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("Withdraw"), [
      createAddress("0x4"), // reserve
      createAddress("0x5"), // user
      createAddress("0x6"), // to
      ethers.BigNumber.from("2000000000"), // amount exceeding the threshold
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_CONFIG.lendingPoolAddress, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_CONFIG.lendingPoolAddress, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });
});
