import { Finding, ethers, HandleBlock } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { createAddress, MockEthersProvider, TestBlockEvent, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import utils from "./utils";

const WRONG_EVENT_ABI: string[] = ["event Transfer(address indexed from,address indexed to,uint256 value)"];

const WRONG_EVENTS_IFACE: ethers.utils.Interface = new ethers.utils.Interface(WRONG_EVENT_ABI);

const TEST_GMX_VAULT: string = createAddress("0xcdcd");

const TEST_NETWORK_DATA = {
  0: {
    address: TEST_GMX_VAULT,
    threshold: 50,
    blockNumber: 100,
  },
};

const EXPECTED_FINDINGS = [
  utils.createFinding(createAddress("0x01"), "50"),
  utils.createFinding(createAddress("0x02"), "150"),
  utils.createFinding(createAddress("0x03"), "200"),
];

const generateLogs = (account: string, numberOfLogs: number, fromBlock: number) => {
  const event = utils.EVENTS_IFACE.getEvent(utils.DECREASE_POSITION_EVENT);
  const logs = [];
  for (let index = 0; index < numberOfLogs; index++) {
    logs.push({
      fromBlock: fromBlock + index,
      toBlock: fromBlock + index + 1,
      ...utils.EVENTS_IFACE.encodeEventLog(event, [
        "0x8637fa101169e83385804a3f0a78a217f4d0b17a07beefd838a039238444e37e",
        account,
        createAddress("0x01"),
        createAddress("0x01"),
        1,
        1,
        true,
        1,
        1,
      ]),
    });
  }
  return logs;
};
describe("Detects many position closing from an account within a time-frame test suite", () => {
  let handleBlock: HandleBlock;
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const networkManager = new NetworkManager(TEST_NETWORK_DATA);
  networkManager.setNetwork(0);

  it("should ignore events emitted on another contract", async () => {
    const wrongContractAddress = createAddress("0x02");
    const filter = {
      fromBlock: 2900,
      toBlock: 3000,
      address: wrongContractAddress,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.DECREASE_POSITION_EVENT)],
    };
    const blockEvent = new TestBlockEvent().setNumber(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleBlock = provideHandleBlock(networkManager, mockProvider as any);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore wrong events emitted on the GMX vault contract", async () => {
    const filter = {
      fromBlock: 29900,
      toBlock: 30000,
      address: TEST_GMX_VAULT,
      topics: [WRONG_EVENTS_IFACE.getEventTopic("Transfer")],
    };
    const blockEvent = new TestBlockEvent().setNumber(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleBlock = provideHandleBlock(networkManager, mockProvider as any);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore if the account did not submit many closing", async () => {
    const filter = {
      fromBlock: 29900,
      toBlock: 30000,
      address: TEST_GMX_VAULT,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.DECREASE_POSITION_EVENT)],
    };
    const blockEvent = new TestBlockEvent().setNumber(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 2, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleBlock = provideHandleBlock(networkManager, mockProvider as any);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when account close many positions", async () => {
    const filter = {
      fromBlock: 30000,
      toBlock: 30100,
      address: TEST_GMX_VAULT,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.DECREASE_POSITION_EVENT)],
    };

    const blockEvent = new TestBlockEvent().setNumber(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleBlock = provideHandleBlock(networkManager, mockProvider as any);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([EXPECTED_FINDINGS[0]]);
  });

  it("should return three findings when three accounts close many positions", async () => {
    const filter = {
      fromBlock: 30100,
      toBlock: 30200,
      address: TEST_GMX_VAULT,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.DECREASE_POSITION_EVENT)],
    };
    const blockEvent = new TestBlockEvent().setNumber(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    logs.push(...generateLogs(createAddress("0x02"), 150, filter.fromBlock));
    logs.push(...generateLogs(createAddress("0x03"), 200, filter.fromBlock));
    mockProvider.addFilteredLogs(filter, logs as any);
    handleBlock = provideHandleBlock(networkManager, mockProvider as any);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual(EXPECTED_FINDINGS);
  });
});
