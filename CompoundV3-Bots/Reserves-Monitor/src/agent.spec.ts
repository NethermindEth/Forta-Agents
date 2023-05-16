import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  BlockEvent,
  Network,
  ethers,
} from "forta-agent";
import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { NetworkManager, createChecksumAddress } from "forta-agent-tools";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";
import { AgentState, NetworkData } from "./utils";
import { provideHandleBlock } from "./agent";
import Fetcher from "./dataFetcher";

const COMET_ADDRESSES = [
  createChecksumAddress("0xdef1"),
  createChecksumAddress("0xdEf2"),
];
const BLOCK_NUMBERS = [10, 20, 30];
const ALERT_FREQ = 1000;

const IFACE = new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);
const INIT_TIMESTAMP = 10000;
const network = Network.MAINNET;

const DEFAULT_CONFIG = {
  [network]: {
    cometAddresses: COMET_ADDRESSES,
    alertFrequency: ALERT_FREQ,
  },
};

describe("COMP2-1 - Reserves Monitor Bot Test suite", () => {
  let networkManager: NetworkManager<NetworkData>;
  let mockProvider: MockEthersProvider;
  let handleBlock: HandleBlock;
  let fetcher: Fetcher;
  let state: AgentState = {
    alerts: {},
  };

  const testConfig = DEFAULT_CONFIG[network];

  function createGetReservesCall(
    block: number,
    comet: string,
    reserves: BigNumber
  ) {
    return mockProvider.addCallTo(comet, block, IFACE, "getReserves", {
      inputs: [],
      outputs: [reserves],
    });
  }
  function createTargetReservesCall(
    block: number,
    comet: string,
    targetReserves: BigNumber
  ) {
    return mockProvider.addCallTo(comet, block, IFACE, "targetReserves", {
      inputs: [],
      outputs: [targetReserves],
    });
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(network);

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    await networkManager.init(
      mockProvider as unknown as ethers.providers.Provider
    );
    networkManager.setNetwork(network);

    fetcher = new Fetcher();
    fetcher.loadContracts(
      networkManager,
      mockProvider as unknown as ethers.providers.Provider
    );

    state.alerts = {};
    handleBlock = provideHandleBlock(networkManager, fetcher, state);
  });

  it("returns empty findings if reserves are less than target reserves", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);
    for (const addr of COMET_ADDRESSES) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(80));
    }

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if reserves are negative", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);

    for (const addr of COMET_ADDRESSES) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(-200));
    }
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if Reserves == targetReserves in one comet contract", async () => {
    const reservesValue: BigNumber = BigNumber.from(200);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);

    createTargetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      reservesValue
    );
    createGetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      reservesValue
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(50));
    }

    const findings = await handleBlock(blockEvent);
    expect(JSON.stringify(findings)).toStrictEqual(
      JSON.stringify([
        Finding.from({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: reservesValue.toString(),
          },
        }),
      ])
    );
  });

  it("returns a finding if Reserves > targetReserves in one comet contract", async () => {
    const reservesValue: BigNumber = BigNumber.from(500);
    const targetReservesValue: BigNumber = BigNumber.from(200);

    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);

    createTargetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      targetReservesValue
    );
    createGetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      reservesValue
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(50));
    }

    const findings = await handleBlock(blockEvent);

    expect(JSON.stringify(findings)).toStrictEqual(
      JSON.stringify([
        Finding.fromObject({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        }),
      ])
    );
  });

  it("returns one finding if Reserves > targetReserves and time limit not reached", async () => {
    const reservesValue: BigNumber = BigNumber.from(500);
    const targetReservesValue: BigNumber = BigNumber.from(200);

    // First Block
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);

    createTargetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      targetReservesValue
    );
    createGetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      reservesValue
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(50));
    }

    // Next Block
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[1])
      .setTimestamp(
        blockEvent.block.timestamp + testConfig.alertFrequency - 10
      );

    createTargetReservesCall(
      BLOCK_NUMBERS[1],
      testConfig.cometAddresses[0],
      targetReservesValue
    );
    createGetReservesCall(
      BLOCK_NUMBERS[1],
      testConfig.cometAddresses[0],
      reservesValue
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[1], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[1], addr, BigNumber.from(50));
    }

    const findings = (
      await Promise.all([handleBlock(blockEvent), handleBlock(blockEvent2)])
    ).flat();

    expect(findings.toString()).toStrictEqual(
      [
        Finding.from({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        }),
      ].toString()
    );
  });

  it("returns second finding if Reserves > targetReserves and time limit reached", async () => {
    const reservesValue: BigNumber = BigNumber.from(500);
    const targetReservesValue: BigNumber = BigNumber.from(200);

    createTargetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      targetReservesValue
    );
    createGetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      reservesValue
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[0], addr, BigNumber.from(50));
    }

    // First Block
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);

    const findings = await handleBlock(blockEvent);

    // Next Block
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[1])
      .setTimestamp(
        blockEvent.block.timestamp + testConfig.alertFrequency + 10
      );

    createTargetReservesCall(
      BLOCK_NUMBERS[1],
      testConfig.cometAddresses[0],
      targetReservesValue.add(200)
    );
    createGetReservesCall(
      BLOCK_NUMBERS[1],
      testConfig.cometAddresses[0],
      reservesValue.add(200)
    );
    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[1], addr, BigNumber.from(100));
      createGetReservesCall(BLOCK_NUMBERS[1], addr, BigNumber.from(50));
    }

    findings.push(...(await handleBlock(blockEvent2)));

    expect(findings.toString()).toStrictEqual(
      [
        Finding.from({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        }),
        Finding.from({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.add(200).toString(),
            targetReserves: targetReservesValue.add(200).toString(),
          },
        }),
      ].toString()
    );
  });

  it("returns findings for multiple comet contracts", async () => {
    const reservesValue: BigNumber = BigNumber.from(500);
    const targetReservesValue: BigNumber = BigNumber.from(200);

    // First Block
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[0])
      .setTimestamp(INIT_TIMESTAMP);

    createTargetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      BigNumber.from(100)
    );
    createGetReservesCall(
      BLOCK_NUMBERS[0],
      testConfig.cometAddresses[0],
      BigNumber.from(50)
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(BLOCK_NUMBERS[0], addr, targetReservesValue);
      createGetReservesCall(BLOCK_NUMBERS[0], addr, reservesValue);
    }

    const findings = await handleBlock(blockEvent);

    // Next Block
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setNumber(BLOCK_NUMBERS[1])
      .setTimestamp(
        blockEvent.block.timestamp + testConfig.alertFrequency + 10
      );

    createTargetReservesCall(
      BLOCK_NUMBERS[1],
      testConfig.cometAddresses[0],
      BigNumber.from(100)
    );
    createGetReservesCall(
      BLOCK_NUMBERS[1],
      testConfig.cometAddresses[0],
      BigNumber.from(50)
    );

    for (const addr of COMET_ADDRESSES.slice(1)) {
      createTargetReservesCall(
        BLOCK_NUMBERS[1],
        addr,
        targetReservesValue.add(200)
      );
      createGetReservesCall(BLOCK_NUMBERS[1], addr, reservesValue.add(200));
    }

    findings.push(...(await handleBlock(blockEvent2)));
    const expectedFindings = [];

    for (const addr of COMET_ADDRESSES.slice(1)) {
      expectedFindings.push(
        Finding.from({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: addr,
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        })
      );
    }
    for (const addr of COMET_ADDRESSES.slice(1)) {
      expectedFindings.push(
        Finding.from({
          name: "Comet reserves reached target reserves",
          description: `Reserves on Comet contract are >= target reserves`,
          alertId: "COMP2-1-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            chain: Network[network] || network.toString(),
            comet: addr,
            reserves: reservesValue.add(200).toString(),
            targetReserves: targetReservesValue.add(200).toString(),
          },
        })
      );
    }
    expect(findings.toString()).toStrictEqual(expectedFindings.toString());
  });
});
