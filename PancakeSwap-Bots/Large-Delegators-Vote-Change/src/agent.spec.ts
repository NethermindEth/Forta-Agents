import { FindingSeverity, Finding, HandleTransaction, ethers, getEthersProvider } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { DELEGATE_VOTES_CHANGED_EVENT } from "./abi";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./config";
import bot from "./agent";
import { createFinding } from "./findings";
import { DECIMALS } from "./thresholds";
import { BigNumber } from "ethers";
import BN from "bignumber.js";

function getPercentage(previousBalance: BigNumber, newBalance: BigNumber): string {
  const pbalance_BN = new BN(previousBalance.toString());
  const nbalance_BN = new BN(newBalance.toString());

  return nbalance_BN.minus(pbalance_BN).dividedBy(pbalance_BN).multipliedBy(100).toString() + " %";
}

describe("delegate votes change bot", () => {
  const MOCK_CONTRACT_ADDRESS = createAddress("0x1234");

  let handleTransaction: HandleTransaction;

  let mockTxEvent: TestTransactionEvent;

  let networkManager: NetworkManager<NetworkData>;

  let eventFragment: ethers.utils.EventFragment;
  let mockEventFragment: ethers.utils.EventFragment;

  beforeEach(() => {
    //create test transaction before each test
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    BN.set({ DECIMAL_PLACES: 5 });
    const mockData: Record<number, NetworkData> = {
      1111: {
        cakeAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    //initialize network manager with mock network
    networkManager = new NetworkManager(mockData, 1111);

    handleTransaction = bot.provideHandleTransaction(networkManager);

    eventFragment = ethers.utils.EventFragment.from(DELEGATE_VOTES_CHANGED_EVENT.slice("event ".length));
    mockEventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");
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

      const data = [createAddress("0x2345"), previousBalance, newBalance];

      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
      const findings: Finding[] = await handleTransaction(mockTxEvent);

      const metadata = {
        delegate: createAddress("0x2345"),
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      expect(findings).toStrictEqual([createFinding(deltaPercentage, metadata, FindingSeverity.High)]);
    });

    it("returns empty findings if the event doesn't exceed the threshold", async () => {
      const previousBalance: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.add(BigNumber.from(1).mul(DECIMALS));

      const data = [createAddress("0x2345"), previousBalance, newBalance];

      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns multiple findings if there are multiple DelegateVotesChanged events emitted", async () => {
      const previousBalance_1: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance_1: BigNumber = previousBalance_1.mul(2);
      const deltaPercentage_1: string = getPercentage(previousBalance_1, newBalance_1);

      const previousBalance_2: BigNumber = BigNumber.from(2).mul(DECIMALS);
      const newBalance_2: BigNumber = previousBalance_2.add(BigNumber.from(1).mul(DECIMALS));
      const deltaPercentage_2: string = getPercentage(previousBalance_2, newBalance_2);

      const previousBalance_3: BigNumber = BigNumber.from(10).mul(DECIMALS);
      const newBalance_3: BigNumber = previousBalance_3.add(BigNumber.from(3).mul(DECIMALS));
      const deltaPercentage_3: string = getPercentage(previousBalance_3, newBalance_3);

      const data_1 = [createAddress("0x0347"), previousBalance_1, newBalance_1];

      const data_2 = [createAddress("0x2045"), previousBalance_2, newBalance_2];

      const data_3 = [createAddress("0x0345"), previousBalance_3, newBalance_3];

      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data_1);
      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data_2);
      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data_3);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      const metadata_1 = {
        delegate: createAddress("0x0347"),
        previousBalance: previousBalance_1.toString(),
        newBalance: newBalance_1.toString(),
      };
      const metadata_2 = {
        delegate: createAddress("0x2045"),
        previousBalance: previousBalance_2.toString(),
        newBalance: newBalance_2.toString(),
      };
      const metadata_3 = {
        delegate: createAddress("0x0345"),
        previousBalance: previousBalance_3.toString(),
        newBalance: newBalance_3.toString(),
      };
      expect(findings).toStrictEqual([
        createFinding(deltaPercentage_1, metadata_1, FindingSeverity.High),
        createFinding(deltaPercentage_2, metadata_2, FindingSeverity.Medium),
        createFinding(deltaPercentage_3, metadata_3, FindingSeverity.Low),
      ]);
    });

    it("returns empty findings if the event is emitted from an incorrect contract address", async () => {
      const previousBalance: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.mul(2);

      const data = [createAddress("0x2345"), previousBalance, newBalance];
      mockTxEvent.addInterfaceEventLog(eventFragment, createAddress("0x0239"), data);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the wrong event is emitted", async () => {
      const data = [999];

      mockTxEvent.addInterfaceEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, data);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings only for the correct event", async () => {
      const previousBalance: BigNumber = BigNumber.from(5).mul(DECIMALS);
      const newBalance: BigNumber = previousBalance.add(BigNumber.from(3).mul(DECIMALS));
      const deltaPercentage: string = getPercentage(previousBalance, newBalance);

      const data_1 = [999];
      const data_2 = [createAddress("0x2045"), previousBalance, newBalance];

      mockTxEvent.addInterfaceEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, data_1);
      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data_2);

      const metadata = {
        delegate: createAddress("0x2045"),
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([createFinding(deltaPercentage, metadata, FindingSeverity.Medium)]);
    });

    it("returns a finding if there is a DelegateVotesChanged event emitted and the previous vote balance is 0", async () => {
      const previousBalance: BigNumber = BigNumber.from(0);
      const newBalance: BigNumber = BigNumber.from(11).mul(DECIMALS);

      const data = [createAddress("0x2345"), previousBalance, newBalance];

      mockTxEvent.addInterfaceEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      const metadata = {
        delegate: createAddress("0x2345"),
        previousBalance: previousBalance.toString(),
        newBalance: newBalance.toString(),
      };

      expect(findings).toStrictEqual([createFinding(newBalance.toString(), metadata, FindingSeverity.Info)]);
    });
  });
});
