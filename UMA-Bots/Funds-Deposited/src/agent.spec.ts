import { Finding, HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { FUNDS_DEPOSITED_EVENT } from "./ABI";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./config";
import bot from "./agent";
import { createFinding } from "./findings";
import { BigNumber } from "ethers";


describe("funds deposited bot", () => {
  const MOCK_CONTRACT_ADDRESS = createAddress("0x1234");
  jest.setTimeout(200000)

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
    
    const mockData: Record<number, NetworkData> = {
      1111: {
        spokePoolAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    //initialize network manager with mock network
    networkManager = new NetworkManager(mockData, 1111);

    handleTransaction = bot.provideHandleTransaction(networkManager);

    eventFragment = ethers.utils.EventFragment.from(FUNDS_DEPOSITED_EVENT.slice("event ".length));
    mockEventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");
  });

    it("returns empty findings if no events are emitted,", async () => {
  
      mockTxEvent.addEventLog(mockEventFragment ,MOCK_CONTRACT_ADDRESS, [123]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if there is a FundsDeposited event emitted", async () => {

      const amount = BigNumber.from("10000000");
      const originChainId = 1111;
      const destinationChainId = 1000;

      const data = [amount, originChainId, destinationChainId, 123, 1, 1234567, createAddress("0x1234"), createAddress("0x6473"), createAddress("0x0021")];

      mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
      const findings: Finding[] = await handleTransaction(mockTxEvent);

      const metadata = {
        amount: amount.toString(), 
        originChainId: originChainId.toString(),
        destinationChainId: destinationChainId.toString(),
        token: "Test Token"
      };

      expect(findings).toStrictEqual([createFinding(metadata)]);
    });

    it("returns a finding for FundsDeposited if FundsDeposited event and MockEvent are emitted", async () => {

      const amount = BigNumber.from("10000000");
      const originChainId = 1111;
      const destinationChainId = 1000;

      const data = [amount, originChainId, destinationChainId, 123, 1, 1234567, createAddress("0x1234"), createAddress("0x6473"), createAddress("0x0021")];

      mockTxEvent.addEventLog(eventFragment, MOCK_CONTRACT_ADDRESS, data);
      mockTxEvent.addEventLog(mockEventFragment ,MOCK_CONTRACT_ADDRESS, [123])
      const findings: Finding[] = await handleTransaction(mockTxEvent);

      const metadata = {
        amount: amount.toString(), 
        originChainId: originChainId.toString(),
        destinationChainId: destinationChainId.toString(),
        token: "Test Token"
      };

      expect(findings).toStrictEqual([createFinding(metadata)]);
    });

});