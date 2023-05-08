import {
  EntityType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Label,
  ethers,
} from "forta-agent";
import {
  TestTransactionEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { provideInitialize, provideHandleTransaction, BOT_ID } from "./agent";
import { when } from "jest-when";
import { ScanCountType } from "bot-alert-rate";
import { Data, Transfer, WITHDRAW_SIG } from "./utils";

let mockStoredData: Data = {
  nativeTransfers: {},
  alertedAddresses: [],
  alertedHashes: [],
};

const testCreateFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number,
  severity: FindingSeverity
): Finding => {
  const [alertId, confidence, wording] =
    severity === FindingSeverity.Medium
      ? ["NIP-1", 0.9, "funds"]
      : ["NIP-2", 0.6, "transaction"];

  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent ${wording} to ${to} with ${funcSig} as input data`,
    alertId,
    severity,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence,
        remove: false,
      }),
    ],
  });
};

const testCreateLowSeverityFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent funds to ${to} with ${funcSig} as input data`,
    alertId: "NIP-3",
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.6,
        remove: false,
      }),
    ],
  });
};

const testCreateHighSeverityFinding = (
  to: string,
  anomalyScore: number,
  nativeTransfers: Transfer[]
): Finding => {
  const metadata: { [key: string]: string } = {
    attacker: to,
    anomalyScore: anomalyScore.toString(),
  };

  const labels: Label[] = [
    Label.fromObject({
      entity: to,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.7,
      remove: false,
    }),
  ];

  nativeTransfers.forEach((transfer, index) => {
    const victimName = `victim${index + 1}`;
    metadata[victimName] = transfer.from;

    const victimLabel = Label.fromObject({
      entity: transfer.from,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.7,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Possible native ice phishing attack",
    description: `${to} received native tokens from 8+ different addresses`,
    alertId: "NIP-4",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata,
    labels,
  });
};

const testCreateCriticalSeverityFinding = (
  txHash: string,
  attacker: string,
  address: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Contract deployed with characteristics indicative of a potential native ice phishing attack",
    description: `${attacker} created contract with address ${address} to be possibly used in a native ice phishing attack`,
    alertId: "NIP-5",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      attacker,
      address,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: attacker,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

const testCreateWithdrawalFinding = (
  txHash: string,
  attacker: string,
  address: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Withdrawal transaction in a possible native ice phishing attack",
    description: `${attacker} called withdraw function in contract: ${address} possibly used for a native ice phishing attack`,
    alertId: "NIP-6",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      attacker,
      address,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: attacker,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

const mockFetcher = {
  isEoa: jest.fn(),
  getCode: jest.fn(),
  getSignature: jest.fn(),
  getTransactions: jest.fn(),
  getNonce: jest.fn(),
  getFunctions: jest.fn(),
  getEvents: jest.fn(),
  getAddressInfo: jest.fn(),
  getAddresses: jest.fn(),
  getLabel: jest.fn(),
  getSourceCode: jest.fn(),
  getOwner: jest.fn(),
  getNumberOfLogs: jest.fn(),
  hasValidEntries: jest.fn(),
  isValueUnique: jest.fn(),
};
const mockGetAlerts = jest.fn();
const mockCalculateRate = jest.fn();
const mockPersistenceHelper = {
  persist: jest.fn(),
  load: jest.fn(),
};
const mockDatabaseObjectKeys = {
  transfersKey: "mock-nm-native-icephishing-bot-objects-v1",
  alertedAddressesKey: "mock-nm-native-icephishing-bot-objects-v1-alerted",
};

describe("Native Ice Phishing Bot test suite", () => {
  let initialize;
  let handleTransaction: HandleTransaction;
  const mockProvider = new MockEthersProvider();

  beforeEach(async () => {
    initialize = provideInitialize(
      mockProvider as any,
      mockPersistenceHelper as any,
      mockStoredData,
      mockDatabaseObjectKeys,
      mockGetAlerts
    );
    mockProvider.setNetwork(1);
    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);

    mockGetAlerts.mockReturnValue({
      alerts: [],
      pageInfo: {
        hasNextPage: false,
      },
    });

    await initialize();

    handleTransaction = provideHandleTransaction(
      mockFetcher as any,
      mockProvider as any,
      mockPersistenceHelper as any,
      mockDatabaseObjectKeys,
      mockCalculateRate,
      mockStoredData
    );
  });

  it("Should return empty findings if the input data is not a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0x00");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return empty findings if the call is to a contract", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0x12345678");
    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(false);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return a Medium severity finding if the call is to an EOA, the value is non-zero and there's input data that's a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0x12345678")
      .setHash("0xabcd");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.getNonce)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(20000);
    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(true);

    when(mockFetcher.getSignature)
      .calledWith("0x12345678")
      .mockReturnValue("transfer(address,uint256)");

    when(mockFetcher.isValueUnique)
      .calledWith(
        createAddress("0x01"),
        1,
        "0xabcd",
        ethers.BigNumber.from("0x0bb").toString()
      )
      .mockReturnValue(true);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-1", ScanCountType.TxWithInputDataCount, 0)
      .mockReturnValue(0.0034234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0034234,
        FindingSeverity.Medium
      ),
    ]);
  });

  it("Should return an Info severity finding if the call is to an EOA, the value is zero and there's input data that's a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0")
      .setData("0x12345678")
      .setHash("0xabcd");

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(true);

    when(mockFetcher.getSignature)
      .calledWith("0x12345678")
      .mockReturnValue("transfer(address,uint256)");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-2", ScanCountType.TxWithInputDataCount, 0)
      .mockReturnValue(0.0234234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0234234,
        FindingSeverity.Info
      ),
    ]);
  });

  it("Should return a Low severity finding if the call is to a contract, the value is non-zero and there's input data that's a function signature which had previous resulted in a EOA alert", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0xa9059cbb")
      .setHash("0xabcd");

    mockStoredData.alertedHashes.push("0xa9059cbb");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockFetcher.getCode)
      .calledWith(createAddress("0x01"))
      .mockReturnValue("0xccc");
    when(mockFetcher.getFunctions)
      .calledWith("0xccc")
      .mockReturnValue(["func1, transfer(address,uint256)"]);
    when(mockFetcher.getAddressInfo)
      .calledWith(createAddress("0x01"), createAddress("0x0f"), 1, "0xabcd")
      .mockReturnValue([true, false]);
    when(mockFetcher.getNonce)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(20000);
    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(false);

    when(mockFetcher.getSignature)
      .calledWith("0xa9059cbb")
      .mockReturnValue("transfer(address,uint256)");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-3", ScanCountType.TxWithInputDataCount, 0)
      .mockReturnValue(0.0034234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateLowSeverityFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0034234
      ),
    ]);
  });

  it("should return a High severity finding when an EOA suspiciously receives native tokens from 8+ different addressess", async () => {
    const to = createAddress("0x01");
    mockStoredData.nativeTransfers[to] = [
      {
        from: createAddress("0xaa"),
        fromNonce: 32,
        fundingAddress: createAddress("0xbb"),
        latestTo: createAddress("0x01"),
        value: "323",
        timestamp: 160,
      },
      {
        from: createAddress("0xab"),
        fromNonce: 33,
        fundingAddress: createAddress("0xbbc"),
        latestTo: createAddress("0x02"),
        value: "324",
        timestamp: 161,
      },
      {
        from: createAddress("0xad"),
        fromNonce: 34,
        fundingAddress: createAddress("0xbbd"),
        latestTo: createAddress("0x03"),
        value: "325",
        timestamp: 162,
      },
      {
        from: createAddress("0xae"),
        fromNonce: 35,
        fundingAddress: createAddress("0xbbe"),
        latestTo: createAddress("0x04"),
        value: "326",
        timestamp: 161,
      },
      {
        from: createAddress("0xaf"),
        fromNonce: 36,
        fundingAddress: createAddress("0xbcc"),
        latestTo: createAddress("0x05"),
        value: "32343",
        timestamp: 163,
      },
      {
        from: createAddress("0xaaa1"),
        fromNonce: 37,
        fundingAddress: createAddress("0xbbaa"),
        latestTo: createAddress("0x06"),
        value: "32234432",
        timestamp: 164,
      },
      {
        from: createAddress("0xaadd"),
        fromNonce: 324,
        fundingAddress: createAddress("0xbbabab"),
        latestTo: createAddress("0x07"),
        value: "32312121",
        timestamp: 16032,
      },
    ];
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(to)
      .setValue("0x0bb")
      .setTimestamp(6564564)
      .setHash("0xabcd");

    when(mockFetcher.getNonce)
      .calledWith(createAddress("0x0f"))
      .mockReturnValue(2);

    when(mockFetcher.getAddresses)
      .calledWith(createAddress("0x0f"), 1, "0xabcd")
      .mockReturnValue([createAddress("0x0909"), createAddress("0x0988")]);

    when(mockFetcher.getLabel)
      .calledWith(to, 1)
      .mockReturnValue("Fake_Phishing");

    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-4", ScanCountType.TransferCount, 0)
      .mockReturnValue(0.00000034234);

    const transfers = mockStoredData.nativeTransfers[to];
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateHighSeverityFinding(to, 0.00000034234, transfers),
    ]);
  });

  it("should return no findings if a contract is deployed but the contract code doesn't have native ice phishing characteristics", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce("0xccc");
    when(mockFetcher.getEvents).calledWith("0xccc").mockReturnValueOnce([]);
    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce("Not Malicious Contract Code");
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings if a contract is deployed, the contract code can't be fetched, but the bytecode doesn't code the withdraw function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce("0xccc");
    when(mockFetcher.getEvents).calledWith("0xccc").mockReturnValueOnce([]);

    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce("");
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if a contract is deployed and the contract code contains both a payable function and a withdraw-like function", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce("0xccc");
    when(mockFetcher.getEvents).calledWith("0xccc").mockReturnValueOnce([]);

    const sourceCode = `function random() payable {}
    function withdraw() {
      require(owner == msg.sender);
      msg.sender.transfer(address(this).balance);
    }`;
    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce(sourceCode);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-5", ScanCountType.ContractCreationCount, 0)
      .mockReturnValue(0.0034231);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateCriticalSeverityFinding(
        "0xabcd",
        createAddress("0x0f"),
        mockContractAddress,
        0.0034231
      ),
    ]);
  });

  it("should return a finding if a contract is deployed, the source code can't be fetched, but the bytecode contains a withdraw function and a payable function which has already created an alert", async () => {
    mockStoredData.alertedHashes.push("0xa9059cbb");

    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(null)
      .setNonce(23)
      .setHash("0xabcd");
    const mockContractAddress = "0xD5B2a1345290AA8F4c671676650B5a1cE16A8575";
    when(mockFetcher.getCode)
      .calledWith(mockContractAddress)
      .mockReturnValueOnce(`0xa9059cbb${WITHDRAW_SIG}`);
    when(mockFetcher.getEvents)
      .calledWith(`0xa9059cbb${WITHDRAW_SIG}`)
      .mockReturnValueOnce([]);
    when(mockFetcher.getFunctions)
      .calledWith(`0xa9059cbb${WITHDRAW_SIG}`)
      .mockReturnValueOnce([]);
    when(mockFetcher.getSourceCode)
      .calledWith(mockContractAddress, 1)
      .mockReturnValueOnce("");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-5", ScanCountType.ContractCreationCount, 0)
      .mockReturnValueOnce(0.0034231);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateCriticalSeverityFinding(
        "0xabcd",
        createAddress("0x0f"),
        mockContractAddress,
        0.0034231
      ),
    ]);
  });

  it("should return a finding if there's a withdrawal from the owner of a contract used for native ice phishing attack", async () => {
    mockPersistenceHelper.load.mockReturnValueOnce({}).mockReturnValueOnce([]);
    mockFetcher.getTransactions.mockReturnValueOnce([
      { hash: "hash15" },
      { hash: "hash25" },
    ]);
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setData("0x3ccfd60b")
      .setBlock(234)
      .setHash("0xabcd");

    when(mockFetcher.getOwner)
      .calledWith(createAddress("0x01"), 234)
      .mockResolvedValueOnce(createAddress("0x0f"));

    when(mockFetcher.getNumberOfLogs)
      .calledWith(createAddress("0x01"), 234, 1)
      .mockResolvedValueOnce(1);

    when(mockFetcher.hasValidEntries)
      .calledWith(createAddress("0x01"), 1, "0xabcd")
      .mockResolvedValueOnce(true);

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-6", ScanCountType.CustomScanCount, 1)
      .mockReturnValueOnce(0.0134231);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateWithdrawalFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        0.0134231
      ),
    ]);
  });
});
