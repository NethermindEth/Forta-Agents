import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, Network } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { TestBlockEvent, createAddress as padAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { TOKEN_ABI, EVENT } from "./constants";
import { AgentConfig, NetworkData, SmartCaller } from "./utils";

const createAddress = (address: string): string => ethers.utils.getAddress(padAddress(address.toLowerCase()));

const VAULT_IFACE = new ethers.utils.Interface(EVENT);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const TOKEN_IFACE = new ethers.utils.Interface(TOKEN_ABI);
const BAL_ADDRESS = createAddress("0x1");

const getTransferLog = (
  emitter: string,
  block: number,
  from: string,
  to: string,
  value: ethers.BigNumberish
): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...VAULT_IFACE.encodeEventLog(VAULT_IFACE.getEvent("Transfer"), [from, to, ethers.BigNumber.from(value)]),
  } as ethers.providers.Log;
};

const getIrrelevantEvent = (emitter: string, block: number): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("Event"), []),
  } as ethers.providers.Log;
};

const createFinding = (from: string, to: string, value: BigNumber, percentage: BigNumber): Finding => {
  return Finding.from({
    name: "Large BAL Transfer",
    description: "Large amount of BAL transferred",
    alertId: "BAL-7",
    protocol: "Balancer",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      from,
      to,
      value: value.toString(10),
      percentage: percentage.toString(10),
    },
  });
};

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    balToken: BAL_ADDRESS,
    threshold: "10",
  },
};

describe("Large Bal Token Transfer Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleBlock: HandleBlock;

  beforeEach(() => {
    SmartCaller.clearCache();
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    mockProvider.addCallTo(BAL_ADDRESS, 1, TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: ["50000000000000000000000000"],
    });

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
    handleBlock = provideHandleBlock(provider, networkManager);
  });

  it("should return empty findings with an empty logs list", async () => {
    const blockEvent = new TestBlockEvent();

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([
      getTransferLog(
        createAddress("0xdead"),
        1,
        createAddress("0x2"),
        createAddress("0x3"),
        "6000000000000000000000000"
      ),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore other events emitted from target contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([getIrrelevantEvent(BAL_ADDRESS, 1)]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore events emitted in other blocks", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([
      getTransferLog(BAL_ADDRESS, 0, createAddress("0x2"), createAddress("0x3"), "5000000000000000000000000"),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should not return findings for transfers that are not large", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([
      getTransferLog(BAL_ADDRESS, 1, createAddress("0x2"), createAddress("0x3"), "4900000000000000000000000"),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should return findings for transfers that are large", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([
      getTransferLog(BAL_ADDRESS, 1, createAddress("0x2"), createAddress("0x3"), "5000000000000000000000000"),
      getTransferLog(BAL_ADDRESS, 1, createAddress("0x4"), createAddress("0x5"), "6000000000000000000000000"),
    ]);

    const percentage1 = new BigNumber("5000000000000000000000000")
      .multipliedBy(100)
      .dividedBy(new BigNumber("50000000000000000000000000"));

    const percentage2 = new BigNumber("6000000000000000000000000")
      .multipliedBy(100)
      .dividedBy(new BigNumber("50000000000000000000000000"));

    expect(await handleBlock(blockEvent)).toStrictEqual([
      createFinding(
        createAddress("0x2"),
        createAddress("0x3"),
        new BigNumber("5000000000000000000000000"),
        percentage1
      ),
      createFinding(
        createAddress("0x4"),
        createAddress("0x5"),
        new BigNumber("6000000000000000000000000"),
        percentage2
      ),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });
});
