import { Finding, HandleTransaction, ethers } from "forta-agent";
import {
  createAddress,
  MockEthersProvider,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { handleTransaction } from "./agent";
import utils from "./utils";

const WRONG_EVENT_ABI: string[] = [
  "event Transfer(address indexed from,address indexed to,uint256 value)",
];

const WRONG_EVENTS_IFACE: ethers.utils.Interface = new ethers.utils.Interface(
  WRONG_EVENT_ABI
);

const TEST_GMX_VAULT: string = createAddress("0xcdcd");

const CASES = [
  utils.createFinding(createAddress("0x01"), "50"),
  utils.createFinding(createAddress("0x02"), "150"),
  utils.createFinding(createAddress("0x03"), "200"),
];

const generateLogs = (
  account: string,
  numberOfLogs: number,
  fromBlock: number
) => {
  const event = utils.EVENTS_IFACE.getEvent(utils.INCREASE_POSITION_EVENT);
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
describe("Detects many position openings from an account within a time-frame test suite", () => {
  let handleTx: HandleTransaction;
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  it("should ignore events emitted on another contract", async () => {
    const wrongContractAddress = createAddress("0x02");
    const filter = {
      fromBlock: 2500,
      toBlock: 3000,
      address: wrongContractAddress,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.INCREASE_POSITION_EVENT)],
    };
    const txEvent = new TestTransactionEvent().setBlock(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleTx = handleTransaction(
      mockProvider as any,
      utils.positionsNumber,
      utils.blockNumbers,
      TEST_GMX_VAULT
    );
    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore wrong events emitted on the GMX vault contract", async () => {
    const filter = {
      fromBlock: 29500,
      toBlock: 30000,
      address: TEST_GMX_VAULT,
      topics: [WRONG_EVENTS_IFACE.getEventTopic("Transfer")],
    };
    const txEvent = new TestTransactionEvent().setBlock(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleTx = handleTransaction(
      mockProvider as any,
      utils.positionsNumber,
      utils.blockNumbers,
      TEST_GMX_VAULT
    );
    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore if the account did not submit a many opening", async () => {
    const filter = {
      fromBlock: 29500,
      toBlock: 30000,
      address: TEST_GMX_VAULT,
      topics: [WRONG_EVENTS_IFACE.getEventTopic("Transfer")],
    };
    const txEvent = new TestTransactionEvent().setBlock(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 2, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleTx = handleTransaction(
      mockProvider as any,
      utils.positionsNumber,
      utils.blockNumbers,
      TEST_GMX_VAULT
    );
    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when account open many positions", async () => {
    const filter = {
      fromBlock: 1000,
      toBlock: 1500,
      address: TEST_GMX_VAULT,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.INCREASE_POSITION_EVENT)],
    };
    const txEvent = new TestTransactionEvent().setBlock(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    mockProvider.addFilteredLogs(filter, logs as any);
    handleTx = handleTransaction(
      mockProvider as any,
      utils.positionsNumber,
      utils.blockNumbers,
      TEST_GMX_VAULT
    );
    const findings: Finding[] = await handleTx(txEvent);

    expect(findings).toStrictEqual([CASES[0]]);
  });

  it("should return three findings when three accounts open many positions", async () => {
    const filter = {
      fromBlock: 1000,
      toBlock: 1500,
      address: TEST_GMX_VAULT,
      topics: [utils.EVENTS_IFACE.getEventTopic(utils.INCREASE_POSITION_EVENT)],
    };
    const txEvent = new TestTransactionEvent().setBlock(filter.toBlock);
    const logs = generateLogs(createAddress("0x01"), 50, filter.fromBlock);
    logs.push(...generateLogs(createAddress("0x02"), 150, filter.fromBlock));
    logs.push(...generateLogs(createAddress("0x03"), 200, filter.fromBlock));
    mockProvider.addFilteredLogs(filter, logs as any);
    handleTx = handleTransaction(
      mockProvider as any,
      utils.positionsNumber,
      utils.blockNumbers,
      TEST_GMX_VAULT
    );
    const findings: Finding[] = await handleTx(txEvent);

    expect(findings).toStrictEqual(CASES);
  });
});
