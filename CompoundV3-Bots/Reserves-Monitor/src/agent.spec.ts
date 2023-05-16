import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  BlockEvent,
  Network,
  ethers,
} from "forta-agent";
import { NetworkManager, createChecksumAddress } from "forta-agent-tools";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";
import { AgentState, NetworkData } from "./utils";
import { provideHandleBlock, provideInitialize } from "./agent";

const addr = createChecksumAddress;
const bn = ethers.BigNumber.from;

const COMET_ADDRESSES = [addr("0xdef1"), addr("0xdef2")];
const ALERT_INTERVAL = 1000;

const IFACE = new ethers.utils.Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);
const INIT_TIMESTAMP = 10000;

const NETWORK = Network.MAINNET;

const DEFAULT_CONFIG = {
  [NETWORK]: {
    cometAddresses: COMET_ADDRESSES,
    alertInterval: ALERT_INTERVAL,
  },
};

function createFinding(
  comet: string,
  reserves: ethers.BigNumber,
  targetReserves: ethers.BigNumber
): Finding {
  return Finding.from({
    name: "Comet reserves reached target reserves",
    description: "Reserves on Comet contract are >= target reserves",
    alertId: "COMP2-1-1",
    protocol: "Compound",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      chain: Network[NETWORK],
      comet: ethers.utils.getAddress(comet),
      reserves: reserves.toString(),
      targetReserves: targetReserves.toString(),
    },
  });
}

describe("COMP2-1 - Reserves Monitor Bot Test suite", () => {
  let networkManager: NetworkManager<NetworkData>;
  let mockProvider: MockEthersProvider;
  let provider: ethers.providers.Provider;
  let handleBlock: HandleBlock;
  let state: AgentState;

  const testConfig = DEFAULT_CONFIG[NETWORK];

  function createGetReservesCall(
    block: number,
    comet: string,
    reserves: ethers.BigNumber
  ) {
    return mockProvider.addCallTo(comet, block, IFACE, "getReserves", {
      inputs: [],
      outputs: [reserves],
    });
  }

  function createTargetReservesCall(
    block: number,
    comet: string,
    targetReserves: ethers.BigNumber
  ) {
    return mockProvider.addCallTo(comet, block, IFACE, "targetReserves", {
      inputs: [],
      outputs: [targetReserves],
    });
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(NETWORK);
    provider = mockProvider as unknown as ethers.providers.Provider;

    state = {
      alertedAt: {},
      cometContracts: {},
    };

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    const initialize = provideInitialize(state, networkManager, provider);

    handleBlock = provideHandleBlock(state, networkManager);
    await initialize();
  });

  it("returns empty findings if reserves are less than target reserves", async () => {
    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(block)
      .setTimestamp(INIT_TIMESTAMP);

    for (const comet of COMET_ADDRESSES) {
      createTargetReservesCall(block, comet, bn(100));
      createGetReservesCall(block, comet, bn(80));
    }

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if reserves are negative", async () => {
    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(block)
      .setTimestamp(INIT_TIMESTAMP);

    for (const comet of COMET_ADDRESSES) {
      createTargetReservesCall(block, comet, bn(100));
      createGetReservesCall(block, comet, bn(-200));
    }

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if Reserves == targetReserves in one comet contract", async () => {
    const reservesValue = bn(200);

    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(block)
      .setTimestamp(INIT_TIMESTAMP);

    const comet = COMET_ADDRESSES[0];

    createTargetReservesCall(block, comet, reservesValue);

    createGetReservesCall(block, comet, reservesValue);

    for (const comet of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(block, comet, bn(100));
      createGetReservesCall(block, comet, bn(50));
    }

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(comet, reservesValue, reservesValue),
    ]);
  });

  it("returns a finding if Reserves > targetReserves in one comet contract", async () => {
    const reservesValue = bn(500);
    const targetReservesValue = bn(200);

    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(block)
      .setTimestamp(INIT_TIMESTAMP);

    const comet = COMET_ADDRESSES[0];

    createTargetReservesCall(block, comet, targetReservesValue);

    createGetReservesCall(block, comet, reservesValue);

    for (const comet of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(block, comet, bn(100));
      createGetReservesCall(block, comet, bn(50));
    }

    const findings = await handleBlock(blockEvent);
    expect(findings.sort()).toStrictEqual([
      createFinding(comet, reservesValue, targetReservesValue),
    ]);
  });

  it("returns one finding if Reserves > targetReserves and time limit not reached", async () => {
    const reservesValue = bn(500);
    const targetReservesValue = bn(200);

    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    const comet = COMET_ADDRESSES[0];

    createTargetReservesCall(block, comet, targetReservesValue);

    createGetReservesCall(block, comet, reservesValue);

    for (const comet of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(block, comet, bn(100));
      createGetReservesCall(block, comet, bn(50));
    }

    const findings = await handleBlock(blockEvent);

    const nextBlock = 11;
    const nextBlockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(nextBlock)
      .setTimestamp(blockEvent.block.timestamp + testConfig.alertInterval - 1);

    createTargetReservesCall(nextBlock, comet, targetReservesValue);
    createGetReservesCall(nextBlock, comet, reservesValue);

    for (const comet of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(nextBlock, comet, bn(100));
      createGetReservesCall(nextBlock, comet, bn(50));
    }

    const nextFindings = await handleBlock(nextBlockEvent);

    expect(findings).toStrictEqual([
      createFinding(comet, reservesValue, targetReservesValue),
    ]);

    expect(nextFindings).toStrictEqual([]);
  });

  it("returns second finding if Reserves > targetReserves and time limit reached", async () => {
    const reservesValue = bn(500);
    const targetReservesValue = bn(200);

    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    const comet = COMET_ADDRESSES[0];

    createTargetReservesCall(block, comet, targetReservesValue);

    createGetReservesCall(block, comet, reservesValue);

    for (const comet of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(block, comet, bn(100));
      createGetReservesCall(block, comet, bn(50));
    }

    const findings = await handleBlock(blockEvent);

    const nextBlock = 11;
    const nextBlockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(nextBlock)
      .setTimestamp(blockEvent.block.timestamp + testConfig.alertInterval);

    createTargetReservesCall(nextBlock, comet, targetReservesValue);
    createGetReservesCall(nextBlock, comet, reservesValue);

    for (const comet of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(nextBlock, comet, bn(100));
      createGetReservesCall(nextBlock, comet, bn(50));
    }

    const nextFindings = await handleBlock(nextBlockEvent);

    expect(findings).toStrictEqual([
      createFinding(comet, reservesValue, targetReservesValue),
    ]);

    expect(nextFindings).toStrictEqual([
      createFinding(comet, reservesValue, targetReservesValue),
    ]);
  });

  it("returns findings for multiple comet contracts", async () => {
    const reservesValues = COMET_ADDRESSES.map((_, idx) => bn(idx * 100));
    const targetReservesValues = COMET_ADDRESSES.map((_, idx) => bn(idx * 100));

    const block = 10;
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    COMET_ADDRESSES.forEach((comet, idx) => {
      createTargetReservesCall(block, comet, targetReservesValues[idx]);

      createGetReservesCall(block, comet, reservesValues[idx]);
    });

    const findings = await handleBlock(blockEvent);

    const nextBlock = 11;
    const nextBlockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(nextBlock)
      .setTimestamp(blockEvent.block.timestamp + testConfig.alertInterval);

    COMET_ADDRESSES.forEach((comet, idx) => {
      createTargetReservesCall(nextBlock, comet, targetReservesValues[idx]);

      createGetReservesCall(nextBlock, comet, reservesValues[idx]);
    });

    const nextFindings = await handleBlock(nextBlockEvent);

    expect(findings.sort()).toStrictEqual(
      COMET_ADDRESSES.map((comet, idx) =>
        createFinding(comet, reservesValues[idx], targetReservesValues[idx])
      ).sort()
    );

    expect(nextFindings.sort()).toStrictEqual(
      COMET_ADDRESSES.map((comet, idx) =>
        createFinding(comet, reservesValues[idx], targetReservesValues[idx])
      ).sort()
    );
  });
});
