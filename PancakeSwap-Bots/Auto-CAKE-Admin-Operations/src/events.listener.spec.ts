import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { NetworkManager } from "forta-agent-tools";


import bot from "./events.listener";

import { EVENTS } from "./abi";
import { createEventFinding } from "./findings";

describe("CakeVault", () => {
  let handleTransaction: HandleTransaction;

  let mockTxEvent: TestTransactionEvent;

  const MOCK_CONTRACT_ADDRESS = createAddress("0x0123");

  let mockEventFragment: ethers.utils.EventFragment;
  let eventFragments: ethers.utils.EventFragment[] = [];

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });


  beforeAll(() => {
   
    handleTransaction = bot.provideHandleTransaction(MOCK_CONTRACT_ADDRESS);

    EVENTS.forEach((event) => {
      eventFragments.push(ethers.utils.EventFragment.fromString(event.slice("event ".length)))
    });

    mockEventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");
  
  });


  describe("Events handleTransaction", () => {
    it("returns empty findings if no event is emitted", async () => {
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, "", ...[]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the event emitted does not come from the correct contract address", async () => {

      mockTxEvent.addInterfaceEventLog(eventFragments[0], createAddress("0x1044"), []);
      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns finding if Pause event is emitted", async () => {

      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual
      ([
        createEventFinding(eventFragments[0].name, {})
      ]);

    });

    it("returns finding if Unpause event is emitted", async () => {

      mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual
      ([
        createEventFinding(eventFragments[1].name, {})
      ]);

    });

     it("returns findings if both events are emitted", async () => {
      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
      mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual
      ([
        createEventFinding(eventFragments[0].name, {}),
        createEventFinding(eventFragments[1].name, {})
      ]);
 

    });

    it("returns finding only for the correct event", async() =>{

      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
      mockTxEvent.addInterfaceEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, [678]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([createEventFinding(eventFragments[0].name, {})]);


    });


  });
});
