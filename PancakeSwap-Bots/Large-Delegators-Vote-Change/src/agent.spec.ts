import { FindingType, FindingSeverity, Finding, HandleTransaction, createTransactionEvent, ethers } from "forta-agent";
import {createAddress, TestTransactionEvent} from "forta-agent-tools/lib/tests"
import {DELEGATE_VOTES_CHANGED_EVENT} from "./abi"
import {NetworkManager} from "forta-agent-tools"
import {NetworkData} from "./config"
import bot from "./agent";

describe("delegate votes change bot", () => {
  const MOCK_CONTRACT_ADDRESS = createAddress("0x1234");

  let handleTransaction: HandleTransaction;
  let eventInterface: ethers.utils.Interface;

  let mockTxEvent: TestTransactionEvent;

  let networkManager: NetworkManager<NetworkData>;

  beforeEach(() => {
    //create test transaction before each test
    mockTxEvent = new TestTransactionEvent();
  })

  beforeAll(() => {

    const mockData: Record<number, NetworkData> = {
      1111: {
        cakeAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    //initialize network manager with mock network
    networkManager = new NetworkManager(mockData, 1111);

    handleTransaction = bot.provideHandleTransaction(networkManager);

    eventInterface = new ethers.utils.Interface([DELEGATE_VOTES_CHANGED_EVENT])

  });

  describe("handleTransaction", () => {
    it("returns empty findings if no events are emitted,", async () => {

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, "", ...[]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);   

    });

    it("returns a finding if there is a DelegateVotesChanged event emitted", async () => {
      let eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("DelegateVotesChanged"), [
        createAddress("0x2314"),
      ]);
      mockTxEvent.addAnonymousEventLog(createAddress("0x5647"), eventLog.data, ...eventLog.topics);

     
   
    });
  });
});
