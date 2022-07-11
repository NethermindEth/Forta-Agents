import { FindingSeverity, Finding, HandleTransaction, ethers } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { DELEGATE_VOTES_CHANGED_EVENT } from "./abi";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./config";
import bot from "./agent";
import { createFinding } from "./findings";
import { DECIMALS } from "./thresholds";
import {BigNumber} from "ethers";
import BN from "bignumber.js";


function getPercentage(previousBalance: BigNumber, newBalance: BigNumber): string {
  let pbalance_BN = new BN(previousBalance.toString());
  let nbalance_BN = new BN(newBalance.toString());

  return nbalance_BN.minus(pbalance_BN).dividedBy(pbalance_BN).multipliedBy(100).toString() + " %";
}

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
    
    BN.set({DECIMAL_PLACES: 5});
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
      const previousBalance: BigNumber = BigNumber.from(8).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.add(BigNumber.from(10).mul(DECIMALS));
      const deltaPercentage: string = getPercentage(previousBalance, newBalance);

      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2345"),
        previousBalance,
        newBalance,
      ]);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      let metadata = {
        delegate: createAddress("0x2345"),
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      let description: string = deltaPercentage;

      expect(findings).toStrictEqual([createFinding(description, metadata, FindingSeverity.High)]);
    });

    it("returns empty findings if the event doesn't exceed the threshold", async () => {
      const previousBalance: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.add(BigNumber.from(1).mul(DECIMALS));

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
      const previousBalance_1: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance_1: BigNumber = previousBalance_1.mul(2);
      const deltaPercentage_1: string = getPercentage(previousBalance_1, newBalance_1);

      const previousBalance_2: BigNumber = BigNumber.from(2).mul(DECIMALS);
      const newBalance_2: BigNumber = previousBalance_2.add(BigNumber.from(1).mul(DECIMALS));
      const deltaPercentage_2: string = getPercentage(previousBalance_2, newBalance_2);

      const previousBalance_3: BigNumber = BigNumber.from(10).mul(DECIMALS);
      const newBalance_3: BigNumber = previousBalance_3.add(BigNumber.from(3).mul(DECIMALS));
      const deltaPercentage_3: string = getPercentage(previousBalance_3, newBalance_3);

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

      let description_1: string = deltaPercentage_1;
      let description_2: string = deltaPercentage_2;
      let description_3: string = deltaPercentage_3;

      expect(findings).toStrictEqual([
        createFinding(description_1, metadata_1, FindingSeverity.High),
        createFinding(description_2, metadata_2, FindingSeverity.Medium),
        createFinding(description_3, metadata_3, FindingSeverity.Low),
      ]);
    });

    it("returns empty findings if the event is emitted from an incorrect contract address", async () => {
      const previousBalance: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.mul(2);

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
      const previousBalance: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.add(BigNumber.from(3).mul(DECIMALS));
      const deltaPercentage: string = getPercentage(previousBalance, newBalance);

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

      let description: string = deltaPercentage;

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([createFinding(description, metadata, FindingSeverity.Medium)]);
    });

    it("returns a finding if there is a DelegateVotesChanged event emitted and the previous vote balance is 0", async () => {
      const previousBalance: BigNumber = BigNumber.from(0);
      const newBalance: BigNumber = BigNumber.from(11).mul(DECIMALS);

      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2345"),
        previousBalance,
        newBalance,
      ]);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      let metadata = {
        delegate: createAddress("0x2345"),
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      expect(findings).toStrictEqual([createFinding(newBalance.toString(), metadata, FindingSeverity.Info)]);
    });
  });
});
