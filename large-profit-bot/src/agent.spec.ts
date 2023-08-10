import { FindingType, FindingSeverity, Finding, HandleTransaction, ethers, Label, EntityType } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import { Interface } from "ethers/lib/utils";
import { createAddress } from "forta-agent-tools";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { ERC20_TRANSFER_EVENT, FUNCTION_ABIS } from "./utils";

jest.mock("node-fetch");

// Mock the fetchJwt function of the forta-agent module
const mockFetchJwt = jest.fn();
jest.mock("forta-agent", () => {
  const original = jest.requireActual("forta-agent");
  return {
    ...original,
    fetchJwt: () => mockFetchJwt(),
  };
});

class MockEthersProviderExtended extends MockEthersProvider {
  public getTransactionCount: any;
  public getCode: any;

  constructor() {
    super();
    this.getTransactionCount = jest.fn();
    this.getCode = jest.fn();
  }

  public setNonce(addr: string, block: number, nonce: number): MockEthersProviderExtended {
    when(this.getTransactionCount).calledWith(addr, block).mockReturnValue(nonce);
    return this;
  }

  public setCode(address: string, code: string, blockNumber: number): MockEthersProviderExtended {
    when(this.getCode).calledWith(address, blockNumber).mockReturnValue(Promise.resolve(code));
    return this;
  }
}

class TestTransactionEventExtended extends TestTransactionEvent {
  constructor() {
    super();
    this.transaction.to = null;
  }
}

const testCreateFinding = (
  addresses: { address: string; confidence: number; anomalyScore: number; isProfitInUsd: boolean; profit: number }[],
  txHash: string,
  severity: FindingSeverity,
  txFrom: string,
  txTo: string
): Finding => {
  let labels: Label[] = [];
  let metadata: {
    [key: string]: string;
  } = {};
  metadata["txFrom"] = txFrom;
  metadata["txTo"] = txTo;
  const anomalyScore = addresses.reduce(
    (min, { anomalyScore }) => Math.min(min, anomalyScore),
    addresses[0].anomalyScore
  );
  metadata["anomalyScore"] = anomalyScore.toString();

  let index = 1;
  let profit = "";
  addresses.map((address) => {
    profit = address.isProfitInUsd ? `$${address.profit.toFixed(2)}` : `${address.profit}% of total supply`;
    metadata[`profit${index}`] = profit;
    index++;
    labels.push(
      Label.fromObject({
        entity: address.address,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: address.confidence,
        remove: false,
      })
    );
  });
  if (!labels.some((label) => label.entity.toLowerCase() === txFrom)) {
    // Get the max confidence of the existing labels and set it as the confidence of the txFrom label
    const maxConfidence = labels.reduce((max, label) => {
      return label.confidence > max ? label.confidence : max;
    }, 0);
    labels.push(
      Label.fromObject({
        entity: ethers.utils.getAddress(txFrom),
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: maxConfidence,
        remove: false,
      })
    );
  }
  labels.push(
    Label.fromObject({
      entity: txHash,
      entityType: EntityType.Transaction,
      label: "Attack",
      confidence: 1,
      remove: false,
    })
  );
  return Finding.fromObject({
    name: "Large Profit",
    description: "Transaction resulted in a large profit for the initiator",
    alertId: "LARGE-PROFIT",
    severity,
    type: FindingType.Suspicious,
    metadata,
    labels,
  });
};

const mockTxFrom = createAddress("0x1234");
const TEST_TOKEN = createAddress("0x2222");
const TRANSFER_IFACE = new Interface([ERC20_TRANSFER_EVENT]);

const transferEvent = TRANSFER_IFACE.getEvent("Transfer");

// used to avoid short logs filtering
const randomEvent = new Interface(["event RandomEvent()"]).getEvent("RandomEvent");

describe("Large Profit Bot test suite", () => {
  const mockProvider: MockEthersProviderExtended = new MockEthersProviderExtended();
  const mockFetcher = {
    getValueInUsd: jest.fn(),
    getTotalSupply: jest.fn(),
    getCLandAS: jest.fn(),
    getContractCreator: jest.fn(),
    getContractInfo: jest.fn(),
    isContractVerified: jest.fn(),
    hasHighNumberOfHolders: jest.fn(),
  };
  const handleTransaction: HandleTransaction = provideHandleTransaction(mockFetcher as any, mockProvider as any);

  it("should return empty findings if the receiver of the transaction is an EOA", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x", 1);
    const txEvent = new TestTransactionEvent().setTo(mockTxTo).setBlock(1);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the transaction count of the initiator is over the threshold", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 100); //Over the threshold
    const txEvent = new TestTransactionEvent().setFrom(mockTxFrom).setTo(mockTxTo).setBlock(1);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the are no transfers", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);

    const txEvent = new TestTransactionEvent().setFrom(mockTxFrom).setTo(mockTxTo).setBlock(1);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the usd value is under 10000", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(9999);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the profit is under the threshold of total supply percentage, when the usd value can't be fetched", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("12")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "12", TEST_TOKEN).mockReturnValue(0);
    when(mockFetcher.getTotalSupply).calledWith(10, TEST_TOKEN).mockReturnValue(ethers.BigNumber.from("20000"));

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the tx involves remove liquidity function", async () => {
    const mockTxTo = createAddress("0x56789");
    mockProvider.setCode(mockTxTo, "0x1234567", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3)
      .addTraces({
        to: mockTxTo,
        from: mockTransferFrom,
        function: FUNCTION_ABIS[0],
        arguments: [
          ethers.BigNumber.from("3424324324423423"),
          [ethers.BigNumber.from("12345"), ethers.BigNumber.from("12345")],
        ],
      });

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue(mockTxFrom);
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
  it("should return a finding when the tx resulted in a large profit (USD value) for the initiator and the contract called was created by the initiator", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue(mockTxFrom);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, anomalyScore: 1, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return a finding when the tx resulted in a large profit (great percentage of token's total supply) for the initiator and the contract called was created by the initiator", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(0);
    when(mockFetcher.getTotalSupply)
      .calledWith(10, TEST_TOKEN)
      .mockReturnValue(ethers.BigNumber.from("4424324324423423"));

    const percentage = ethers.BigNumber.from("3424324324423423")
      .mul(100)
      .div(ethers.BigNumber.from("4424324324423423"))
      .toNumber();

    when(mockFetcher.hasHighNumberOfHolders).calledWith(1, TEST_TOKEN).mockReturnValue(true);
    when(mockFetcher.getCLandAS).calledWith(percentage, "totalSupply").mockReturnValue([1, 0.001]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue(mockTxFrom);
    when(mockFetcher.getContractCreator).calledWith(TEST_TOKEN, 1).mockReturnValue("0x9876");

    const findings = await handleTransaction(txEvent);

    const addresses = [
      { address: mockTxFrom, confidence: 1, anomalyScore: 0.001, isProfitInUsd: false, profit: percentage },
    ];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return a finding when the tx was a conrtact creation and resulted in a large profit for the initiator", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent: TestTransactionEventExtended = new TestTransactionEventExtended()
      .setFrom(mockTxFrom)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, anomalyScore: 1, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, "")]);
  });

  it("should return a finding if this is the first interaction between the initiator and the contract called", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([true, false]); // First Interaction
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, anomalyScore: 1, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return a finding if the contract called is neither verifed nor has a high number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, false]); // Not high number of past transactions
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(false); // Not verified
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, anomalyScore: 1, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return an Info severity finding if the contract called is not verifed but has a high number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, true]); // High number of past transactions
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(false); // Not verified
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, anomalyScore: 1, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Info, mockTxFrom, mockTxTo)]);
  });

  it("should return an Info severity finding if the contract called is verifed but has a low number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, false]);
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(true);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, anomalyScore: 1, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Info, mockTxFrom, mockTxTo)]);
  });

  it("should return empty findings if the contract called is verifed and has a high number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    // avoid single transfers or swaps
    const data2 = [createAddress("0x1"), createAddress("0x2"), ethers.BigNumber.from("1")];
    const data3 = [createAddress("0x3"), createAddress("0x4"), ethers.BigNumber.from("1")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(randomEvent, createAddress("0x1234"), []) //avoid short logs filtering
      .addEventLog(transferEvent, TEST_TOKEN, data)
      .addEventLog(transferEvent, TEST_TOKEN, data2)
      .addEventLog(transferEvent, TEST_TOKEN, data3);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getCLandAS).calledWith(11000, "usdValue").mockReturnValue([0, 1]);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, true]);
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(true);
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
