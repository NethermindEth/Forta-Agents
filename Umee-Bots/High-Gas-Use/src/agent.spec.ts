import { FindingType, Finding, HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction, getSeverity } from "./agent";
import { AgentConfig } from "./agent.config";

const CONFIG: AgentConfig = {
  mediumGasThreshold: "100000",
  highGasThreshold: "300000",
  criticalGasThreshold: "700000",
  monitoredAddresses: [createAddress("0x111"), createAddress("0x222"), createAddress("0x333")],
};

const testAddresses: string[] = [
  createAddress("0xa1"),
  createAddress("0xa2"),
  createAddress("0xa3"),
  createAddress("0xa4"),
  createAddress("0xa5"),
];

const createFinding = (from: string, to: string | null, addresses: string[], gasUsed: ethers.BigNumber) => {
  return Finding.from({
    alertId: "UMEE-12",
    name: "High amount of gas use",
    description: "High amount of gas is used in transaction",
    type: FindingType.Suspicious,
    severity: getSeverity(gasUsed, CONFIG),
    protocol: "Umee",
    metadata: {
      from,
      to: to || "",
      monitoredAddresses: JSON.stringify(addresses),
      gasUsed: gasUsed.toString(),
    },
  });
};

describe("Detect transaction involving large amount of addresses", () => {
  let handleTransaction: HandleTransaction;
  const mockGetTransactionReceipt = jest.fn();

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(CONFIG, mockGetTransactionReceipt);
  });

  it("returns empty findings when there is not any transaction addresses involved besides 'from address'", async () => {
    const tx = new TestTransactionEvent();

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings when there is a high gas usage not involved with monitored addresses", async () => {
    mockGetTransactionReceipt.mockReturnValue({ gasUsed: 1000000 });

    const tx = new TestTransactionEvent().addInvolvedAddresses(
      createAddress("0x444"),
      createAddress("0x555"),
      ...testAddresses
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings when there is not a high gas usage involved with monitored addresses", async () => {
    const gasUsed = "90000";
    mockGetTransactionReceipt.mockReturnValue({ gasUsed });

    const tx = new TestTransactionEvent().addInvolvedAddresses(
      CONFIG.monitoredAddresses[0],
      CONFIG.monitoredAddresses[1],
      createAddress("0x666"),
      createAddress("0x777")
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding when there is a high gas usage involved with a monitored address", async () => {
    const gasUsed = "1000000";
    mockGetTransactionReceipt.mockReturnValue({ gasUsed });

    const tx = new TestTransactionEvent().addInvolvedAddresses(CONFIG.monitoredAddresses[0], ...testAddresses);

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(
        tx.transaction.from,
        tx.transaction.to,
        [CONFIG.monitoredAddresses[0]],
        ethers.BigNumber.from(gasUsed)
      ),
    ]);
  });

  it("returns a finding with two monitored addresses when there is a high amount of gas use involved with two monitored addresses in the same transaction", async () => {
    const gasUsed = "10000000";
    mockGetTransactionReceipt.mockReturnValue({ gasUsed });

    const tx = new TestTransactionEvent().addInvolvedAddresses(
      CONFIG.monitoredAddresses[0],
      CONFIG.monitoredAddresses[1],
      ...testAddresses
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(
        tx.transaction.from,
        tx.transaction.to,
        [CONFIG.monitoredAddresses[0], CONFIG.monitoredAddresses[1]],
        ethers.BigNumber.from(gasUsed)
      ),
    ]);
  });

  it("returns a finding with multiple monitored addresses while omitting irrelevant addresses when there are a large number of transaction addresses involved with multiple monitored addresses in the same transaction", async () => {
    const gasUsed = "10000000";
    mockGetTransactionReceipt.mockReturnValue({ gasUsed });

    const tx = new TestTransactionEvent().addInvolvedAddresses(
      CONFIG.monitoredAddresses[0],
      CONFIG.monitoredAddresses[2],
      createAddress("0x444"),
      createAddress("0x555"),
      ...testAddresses
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(
        tx.transaction.from,
        tx.transaction.to,
        [CONFIG.monitoredAddresses[0], CONFIG.monitoredAddresses[2]],
        ethers.BigNumber.from(gasUsed)
      ),
    ]);
  });
});
