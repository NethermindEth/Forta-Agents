import {
  ethers,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
  Network,
} from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { Interface } from "ethers/lib/utils";
import { NetworkManager, createChecksumAddress } from "forta-agent-tools";
import { SUPPLY_ABI, TRANSFER_ABI, BUY_COLLATERAL_ABI } from "./constants";
import { provideHandleTransaction, provideInitialize } from "./agent";
import { AgentConfig, NetworkData } from "./utils";

const addr = createChecksumAddress;

function createTransferFinding(comet: string, sender: string, amount: ethers.BigNumberish): Finding {
  return Finding.from({
    name: "Direct base token transfer to Comet contract",
    description: "A base token transfer was made to a Comet contract without a matching Supply or BuyCollateral event",
    alertId: "COMP2-3-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      chain: Network[NETWORK],
      comet: ethers.utils.getAddress(comet),
      sender: ethers.utils.getAddress(sender),
      transferAmount: amount.toString(),
    },
    addresses: [ethers.utils.getAddress(comet), ethers.utils.getAddress(sender)],
  });
}

const COMET_CONTRACTS = [
  { address: addr("0x11a"), baseToken: addr("0x21f") },
  { address: addr("0x12a"), baseToken: addr("0x22f") },
  { address: addr("0x13a"), baseToken: addr("0x23F") },
  { address: addr("0x14a"), baseToken: addr("0x24f") },
];
const TEST_ADDRESSES = COMET_CONTRACTS.map((comet) => comet.address);
const BASE_TOKENS = COMET_CONTRACTS.map((comet) => comet.baseToken);

const TEST_USERS = [addr("0x31"), addr("0x32"), addr("0x33"), addr("0x34")];

const TRANSFER_IFACE = new Interface([TRANSFER_ABI]);
const COMET_IFACE = new Interface([SUPPLY_ABI, BUY_COLLATERAL_ABI]);

const NETWORK = Network.MAINNET;
const TEST_CONFIG: AgentConfig = {
  [NETWORK]: { cometContracts: COMET_CONTRACTS },
};

describe("COMP2-3 - Base Token Transfers Monitor Bot Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;
  let mockProvider: MockEthersProvider;

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(NETWORK);

    const provider = mockProvider as unknown as ethers.providers.Provider;
    networkManager = new NetworkManager(TEST_CONFIG, NETWORK);

    const initialize = provideInitialize(networkManager, provider);
    handleTransaction = provideHandleTransaction(networkManager);
    await initialize();
  });

  it("returns empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer happens in a non-baseToken contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      addr("0xffe"),
      [TEST_USERS[0], TEST_ADDRESSES[0], 200]
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer happens in a baseToken of a different comet contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      BASE_TOKENS[1],
      [TEST_USERS[0], TEST_ADDRESSES[0], 200]
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer target is not a comet contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      BASE_TOKENS[0],
      [TEST_USERS[0], addr("0xffa"), 200]
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer event was emitted with matching Supply event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[0], [TEST_USERS[0], TEST_ADDRESSES[0], 500])
      .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[0], [TEST_USERS[0], TEST_ADDRESSES[0], 500]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if Transfer event was emitted with matching BuyCollateral event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[0], [TEST_USERS[0], TEST_ADDRESSES[0], 500])
      .addEventLog(COMET_IFACE.getEvent("BuyCollateral"), TEST_ADDRESSES[0], [TEST_USERS[0], BASE_TOKENS[1], 500, 0]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns a finding if Transfer event was emitted with no Supply or BuyCollateral events", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      TRANSFER_IFACE.getEvent("Transfer"),
      BASE_TOKENS[0],
      [TEST_USERS[0], TEST_ADDRESSES[0], 500]
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 500),
    ]);
  });

  it("returns a finding if Transfer event was emitted with non-matching Supply event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[0], [TEST_USERS[0], TEST_ADDRESSES[0], 500])
      .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[0], [TEST_USERS[0], TEST_ADDRESSES[0], 200]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 500),
    ]);

    const nextTxEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[0], [TEST_USERS[0], TEST_ADDRESSES[0], 200])
      .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[0], [TEST_USERS[1], TEST_ADDRESSES[0], 200]);

    expect(await handleTransaction(nextTxEvent)).toStrictEqual([
      createTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 200),
    ]);
  });

  it("returns a finding if Transfer event was emitted with non-matching BuyCollateral", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[0], [TEST_USERS[0], TEST_ADDRESSES[0], 500])
      .addEventLog(COMET_IFACE.getEvent("BuyCollateral"), TEST_ADDRESSES[0], [TEST_USERS[0], BASE_TOKENS[1], 200, 0]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 500),
    ]);

    const nextTxEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[0], [TEST_USERS[0], TEST_ADDRESSES[0], 200])
      .addEventLog(COMET_IFACE.getEvent("BuyCollateral"), TEST_ADDRESSES[0], [TEST_USERS[1], BASE_TOKENS[1], 200, 0]);

    expect(await handleTransaction(nextTxEvent)).toStrictEqual([
      createTransferFinding(TEST_ADDRESSES[0], TEST_USERS[0], 200),
    ]);
  });

  it("only returns a finding on a Transfer with no or non-matching Supply/BuyCollateral events", async () => {
    const txEvent = new TestTransactionEvent();
    const expectedFindings: Finding[] = [];

    for (let i = 0; i < TEST_ADDRESSES.length; i++) {
      txEvent
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[0], TEST_ADDRESSES[i], 500])
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[1], TEST_ADDRESSES[i], 600])
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[2], TEST_ADDRESSES[i], 700])
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[3], TEST_ADDRESSES[i], 800])
        .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[i], [TEST_USERS[0], TEST_ADDRESSES[i], 500])
        .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[i], [TEST_USERS[1], TEST_ADDRESSES[i], 600])
        .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[i], [TEST_USERS[2], TEST_ADDRESSES[i], 800])
        .addEventLog(COMET_IFACE.getEvent("BuyCollateral"), TEST_ADDRESSES[i], [TEST_USERS[2], BASE_TOKENS[0], 700, 0]);

      expectedFindings.push(createTransferFinding(TEST_ADDRESSES[i], TEST_USERS[3], 800));
    }

    expect(await handleTransaction(txEvent)).toStrictEqual(expectedFindings);
  });

  it("returns multiple findings for different Transfer events", async () => {
    const txEvent = new TestTransactionEvent();
    const expectedFindings: Finding[] = [];

    for (let i = 0; i < TEST_ADDRESSES.length; i++) {
      txEvent
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[0], TEST_ADDRESSES[i], 500])
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[0], TEST_ADDRESSES[i], 500])
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[2], TEST_ADDRESSES[i], 700])
        .addEventLog(TRANSFER_IFACE.getEvent("Transfer"), BASE_TOKENS[i], [TEST_USERS[3], TEST_ADDRESSES[i], 800])
        .addEventLog(COMET_IFACE.getEvent("Supply"), TEST_ADDRESSES[i], [TEST_USERS[0], TEST_ADDRESSES[i], 500])
        .addEventLog(COMET_IFACE.getEvent("BuyCollateral"), TEST_ADDRESSES[i], [TEST_USERS[2], BASE_TOKENS[i], 700, 0]);

      expectedFindings.push(
        createTransferFinding(TEST_ADDRESSES[i], TEST_USERS[0], 500),
        createTransferFinding(TEST_ADDRESSES[i], TEST_USERS[3], 800)
      );
    }

    expect(await handleTransaction(txEvent)).toStrictEqual(expectedFindings);
  });
});
