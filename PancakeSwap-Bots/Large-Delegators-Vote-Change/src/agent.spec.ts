import { FindingSeverity, Finding, HandleTransaction, ethers } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { DELEGATE_VOTES_CHANGED_EVENT } from "./abi";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./config";
import bot from "./agent";
import { createFinding } from "./findings";
import { BN, DECIMALS, HIGH_THRESHOLD, LOW_THRESHOLD, MEDIUM_THRESHOLD } from "./thresholds";

describe("delegate votes change bot", () => {
  const MOCK_CONTRACT_ADDRESS = createAddress("0x1234");

  let handleTransaction: HandleTransaction;
  let eventInterface: ethers.utils.Interface;

  let mockTxEvent: TestTransactionEvent;

  let networkManager: NetworkManager<NetworkData>;

  beforeEach(() => {
    //create test transaction before each test
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    const mockData: Record<number, NetworkData> = {
      1111: {
        cakeAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    //initialize network manager with mock network
    networkManager = new NetworkManager(mockData, 1111);

    handleTransaction = bot.provideHandleTransaction(networkManager);

    eventInterface = new ethers.utils.Interface([DELEGATE_VOTES_CHANGED_EVENT, "event MockEvent(uint)"]);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if no events are emitted,", async () => {
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, "", ...[]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if there is a DelegateVotesChanged event emitted that triggers an alert", async () => {
      const newBalance: ethers.BigNumber = BN.from(10).mul(DECIMALS).add(HIGH_THRESHOLD);

      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2345"),
        0,
        newBalance,
      ]);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      let metadata = {
        delegate: createAddress("0x2345"),
        previousBalance: "0",
        newBalance: newBalance.toString(),
      };

      expect(findings).toStrictEqual([createFinding("DelegateVotesChanged", metadata, FindingSeverity.High)]);
    });

    it("returns empty findings if the event doesn't exceed the threshold", async () => {
      const previousBalance: ethers.BigNumber = BN.from(5).mul(DECIMALS);
      const newBalance: ethers.BigNumber = BN.from(-1).mul(DECIMALS).add(LOW_THRESHOLD);

      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2345"),
        previousBalance,
        newBalance,
      ]);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns multiple findings if there are  multiple DelegateVotesChanged events emitted", async () => {
      const previousBalance_1: ethers.BigNumber = BN.from(5).mul(DECIMALS);
      const newBalance_1: ethers.BigNumber = BN.from(5).mul(DECIMALS).add(HIGH_THRESHOLD);
      const previousBalance_2: ethers.BigNumber = BN.from(1).mul(DECIMALS);
      const newBalance_2: ethers.BigNumber = BN.from(2).mul(DECIMALS).add(MEDIUM_THRESHOLD);
      const previousBalance_3: ethers.BigNumber = BN.from(0);
      const newBalance_3: ethers.BigNumber = BN.from(1).mul(DECIMALS).add(LOW_THRESHOLD);

      let eventLog_1 = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x0347"),
        previousBalance_1,
        newBalance_1,
      ]);

      let eventLog_2 = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2045"),
        previousBalance_2,
        newBalance_2,
      ]);

      let eventLog_3 = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x0345"),
        previousBalance_3,
        newBalance_3,
      ]);

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_2.data, ...eventLog_2.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_3.data, ...eventLog_3.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      let metadata_1 = {
        delegate: createAddress("0x0347"),
        previousBalance: previousBalance_1.toString(),
        newBalance: newBalance_1.toString(),
      };
      let metadata_2 = {
        delegate: createAddress("0x2045"),
        previousBalance: previousBalance_2.toString(),
        newBalance: newBalance_2.toString(),
      };
      let metadata_3 = {
        delegate: createAddress("0x0345"),
        previousBalance: previousBalance_3.toString(),
        newBalance: newBalance_3.toString(),
      };

      expect(findings).toStrictEqual([
        createFinding("DelegateVotesChanged", metadata_1, FindingSeverity.High),
        createFinding("DelegateVotesChanged", metadata_2, FindingSeverity.Medium),
        createFinding("DelegateVotesChanged", metadata_3, FindingSeverity.Low),
      ]);
    });

    it("returns empty findings if the event is emitted from an incorrect contract address", async () => {
      const previousBalance: ethers.BigNumber = BN.from(5).mul(DECIMALS);
      const newBalance: ethers.BigNumber = BN.from(5).mul(DECIMALS).add(HIGH_THRESHOLD);

      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2345"),
        previousBalance,
        newBalance,
      ]);
      mockTxEvent.addAnonymousEventLog(createAddress("0x0012"), eventLog.data, ...eventLog.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the wrong event is emitted", async () => {
      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("MockEvent"), [999]);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings only for the correct event", async () => {
      const previousBalance: ethers.BigNumber = BN.from(5).mul(DECIMALS);
      const newBalance: ethers.BigNumber = BN.from(6).mul(DECIMALS).add(MEDIUM_THRESHOLD);

      let eventLog_1 = eventInterface.encodeEventLog(eventInterface.getEvent("MockEvent"), [999]);
      let eventLog_2 = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2045"),
        previousBalance,
        newBalance,
      ]);

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_2.data, ...eventLog_2.topics);

      let metadata = {
        delegate: createAddress("0x2045"),
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([createFinding("DelegateVotesChanged", metadata, FindingSeverity.Medium)]);
    });
  });
});
