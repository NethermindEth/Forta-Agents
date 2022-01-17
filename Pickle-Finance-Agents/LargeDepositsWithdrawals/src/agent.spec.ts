import { 
  Finding, 
  FindingSeverity, 
  FindingType, 
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { 
  createAddress, 
  encodeParameter, 
  TestTransactionEvent
} from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import { BigNumber } from "ethers";

const SIGNATURE: string = "Transfer(address,address,uint256)";
const VAULTS_LIST: string[] = [
  createAddress("0xfee5"),
  createAddress("0xdef1"),
  createAddress("0xc0de"),
  createAddress("0xf1a7"),
  createAddress("0xca11"),
]
const VAULTS: Set<string> = new Set<string>(VAULTS_LIST);

const promise = (value: number) => new Promise(resolve => resolve(BigNumber.from(value)));

const DepositFinding = (from: string, amount: string, jar: string): Finding => Finding.fromObject({
  name: "Pickle Jar Deposit",
  description: "Large deposit detected",
  alertId: "pickle-2-1",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Pickle Finance",
  metadata: {
    amount, from, jar
  }
});

const WithdrawFinding = (from: string, amount: string, jar: string): Finding => Finding.fromObject({
  name: "Pickle Jar Withdraw",
  description: "Large withdraw detected",
  alertId: "pickle-2-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Pickle Finance",
  metadata: {
    amount, from, jar
  }
});

describe("Large Withdrawals/Deposits monitor agent tests suite", () => {
  const mockGetVaults = jest.fn();
  const mockGetSupply = jest.fn();
  const mockFetcher = {
    getVaults: mockGetVaults,
    getSupply: mockGetSupply,
  }
  const handler: HandleTransaction = provideHandleTransaction(mockFetcher as any, BigNumber.from(20));

  beforeEach(() => {
    mockGetSupply.mockClear();
    mockGetVaults.mockClear();
  })

  it("should return empty findings if there are no vaults", async () => {
    when(mockGetVaults)
      .calledWith(20)
      .mockReturnValueOnce([]);
    
    const tx: TransactionEvent = new TestTransactionEvent().setBlock(20);
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
    expect(mockGetVaults).toBeCalled;
  });

  it("should return empty findings if no events emitted", async () => {
    when(mockGetVaults)
      .calledWith(10)
      .mockReturnValueOnce(VAULTS);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(10);
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
    expect(mockGetSupply).toBeCalled;
  });

  it("should ignore regular transfers", async () => {
    when(mockGetVaults)
      .calledWith(200)
      .mockReturnValueOnce(VAULTS);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(200)
      .addEventLog(
        SIGNATURE,
        VAULTS_LIST[0],
        encodeParameter("uint256", 5000000),
        createAddress("0xE0A1"),
        createAddress("0xE0A2"),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transfers in non-vault contracts", async () => {
    when(mockGetVaults)
      .calledWith(200)
      .mockReturnValueOnce(VAULTS);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(200)
      .addEventLog(
        SIGNATURE,
        createAddress("0xDA01"),
        encodeParameter("uint256", 1000000),
        createAddress("0x0"),
        createAddress("0xE0A2"),
      )
      .addEventLog(
        SIGNATURE,
        createAddress("0xDA02"),
        encodeParameter("uint256", 200000),
        createAddress("0xE0A1"),
        createAddress("0x0"),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings", async () => {
    when(mockGetVaults)
      .calledWith(2001)
      .mockReturnValueOnce(VAULTS);

    when(mockGetSupply)
      .calledWith(2001, VAULTS_LIST[0])
      .mockReturnValueOnce(promise(1000))
    when(mockGetSupply)
      .calledWith(2001, VAULTS_LIST[1])
      .mockReturnValueOnce(promise(1000))
    when(mockGetSupply)
      .calledWith(2001, VAULTS_LIST[2])
      .mockReturnValueOnce(promise(100))
    when(mockGetSupply)
      .calledWith(2001, VAULTS_LIST[3])
      .mockReturnValueOnce(promise(10))

    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(2001)
      .addEventLog(
        SIGNATURE,
        VAULTS_LIST[0],
        encodeParameter("uint256", 200), // large
        encodeParameter("address", createAddress("0x0")),
        encodeParameter("address", createAddress("0xE0A1")),
      )
      .addEventLog(
        SIGNATURE,
        VAULTS_LIST[1],
        encodeParameter("uint256", 199), // not large
        encodeParameter("address", createAddress("0x0")),
        encodeParameter("address", createAddress("0xE0A2")),
      )
      .addEventLog(
        SIGNATURE,
        VAULTS_LIST[2],
        encodeParameter("uint256", 20), // large
        encodeParameter("address", createAddress("0xE0A3")),
        encodeParameter("address", createAddress("0x0")),
      )
      .addEventLog(
        SIGNATURE,
        VAULTS_LIST[3],
        encodeParameter("uint256", 1), // not large
        encodeParameter("address", createAddress("0xE0A4")),
        encodeParameter("address", createAddress("0x0")),
      );    

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      DepositFinding(createAddress("0xe0a1"), "200", VAULTS_LIST[0]),
      WithdrawFinding(createAddress("0xe0a3"), "20", VAULTS_LIST[2]),
    ]);
  });
});
