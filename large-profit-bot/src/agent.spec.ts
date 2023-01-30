import { FindingType, FindingSeverity, Finding, HandleTransaction, ethers, Label, EntityType } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import { Interface } from "ethers/lib/utils";
import { createAddress } from "forta-agent-tools";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { ERC20_TRANSFER_EVENT } from "./utils";

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
  addresses: { address: string; confidence: number; isProfitInUsd: boolean; profit: number }[],
  txHash: string,
  severity: FindingSeverity,
  txFrom: string,
  txTo: string
): Finding => {
  let labels = [];
  let metadata: {
    [key: string]: string;
  } = {};
  metadata["txFrom"] = txFrom;
  metadata["txTo"] = txTo;

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
        label: "Large Profit Receiver",
        confidence: address.confidence,
        remove: false,
      })
    );
  });
  labels.push(
    Label.fromObject({
      entity: txHash,
      entityType: EntityType.Transaction,
      label: "Large Profit Transaction",
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

describe("Large Profit Bot test suite", () => {
  const mockProvider: MockEthersProviderExtended = new MockEthersProviderExtended();
  const mockFetcher = {
    getValueInUsd: jest.fn(),
    getTotalSupply: jest.fn(),
    getConfidenceLevel: jest.fn(),
    getContractCreator: jest.fn(),
    getContractInfo: jest.fn(),
    isContractVerified: jest.fn(),
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
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

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
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "12", TEST_TOKEN).mockReturnValue(0);
    when(mockFetcher.getTotalSupply).calledWith(10, TEST_TOKEN).mockReturnValue(ethers.BigNumber.from("20000"));

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
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue(mockTxFrom);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return a finding when the tx resulted in a large profit (great percentage of token's total supply) for the initiator and the contract called was created by the initiator", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(0);
    when(mockFetcher.getTotalSupply)
      .calledWith(10, TEST_TOKEN)
      .mockReturnValue(ethers.BigNumber.from("4424324324423423"));

    const percentage = ethers.BigNumber.from("3424324324423423")
      .mul(100)
      .div(ethers.BigNumber.from("4424324324423423"))
      .toNumber();

    when(mockFetcher.getConfidenceLevel).calledWith(percentage, "totalSupply").mockReturnValue(1);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue(mockTxFrom);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 1, isProfitInUsd: false, profit: percentage }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return a finding when the tx was a conrtact creation and resulted in a large profit for the initiator", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent: TestTransactionEventExtended = new TestTransactionEventExtended()
      .setFrom(mockTxFrom)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, "")]);
  });

  it("should return a finding if this is the first interaction between the initiator and the contract called", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([true, false]); // First Interaction
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return a finding if the contract called is neither verifed nor has a high number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, false]); // Not high number of past transactions
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(false); // Not verified
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Medium, mockTxFrom, mockTxTo)]);
  });

  it("should return an Info severity finding if the contract called is not verifed but has a high number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, true]); // High number of past transactions
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(false); // Not verified
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Info, mockTxFrom, mockTxTo)]);
  });

  it("should return an Info severity finding if the contract called is verifed but has a low number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, false]);
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(true);
    const findings = await handleTransaction(txEvent);

    const addresses = [{ address: mockTxFrom, confidence: 0, isProfitInUsd: true, profit: 11000 }];
    expect(findings).toStrictEqual([testCreateFinding(addresses, "0x1", FindingSeverity.Info, mockTxFrom, mockTxTo)]);
  });

  it("should return empty findings if the contract called is verifed and has a high number of past transactions", async () => {
    const mockTxTo = createAddress("0x5678");
    mockProvider.setCode(mockTxTo, "0x123456", 1);
    mockProvider.setNonce(mockTxFrom, 1, 1);
    mockProvider.setNetwork(1);

    const mockTransferFrom = createAddress("0x4444");
    const data = [mockTransferFrom, mockTxFrom, ethers.BigNumber.from("3424324324423423")];
    const txEvent = new TestTransactionEvent()
      .setFrom(mockTxFrom)
      .setTo(mockTxTo)
      .setHash("0x1")
      .setBlock(10)
      .addEventLog(transferEvent, TEST_TOKEN, data);

    when(mockFetcher.getValueInUsd).calledWith(10, 1, "3424324324423423", TEST_TOKEN).mockReturnValue(11000);
    when(mockFetcher.getConfidenceLevel).calledWith(11000, "usdValue").mockReturnValue(0);
    when(mockFetcher.getContractCreator).calledWith(mockTxTo, 1).mockReturnValue("0x4545");
    when(mockFetcher.getContractInfo).calledWith(mockTxTo, mockTxFrom, 1).mockReturnValue([false, true]);
    when(mockFetcher.isContractVerified).calledWith(mockTxTo, 1).mockReturnValue(true);
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
