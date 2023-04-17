import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
  BlockEvent,
} from "forta-agent";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";

import {
  createAddress,
  TestBlockEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import Fetcher from "./dataFetcher";

const TEST_ADDRESSES = [createAddress("0x11"), createAddress("0x12")];
const mockProvider: MockEthersProvider = new MockEthersProvider();
const ALERT_FREQ = 1000;
const mockGetFn = (id: string) => {
  if (id == "cometAddresses") return TEST_ADDRESSES;
  else return ALERT_FREQ;
};
const mockNetworkManager = {
  cometAddresses: TEST_ADDRESSES,
  networkMap: {},
  setNetwork: jest.fn(),
  get: mockGetFn as any,
};

const IFACE = new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);
const INIT_TIMESTAMP = 10000;

describe("COMP2 - Reserves Monitor Bot Tests suite", () => {
  let handleBlock: HandleBlock;
  let testConfig = {
    cometAddresses: TEST_ADDRESSES,
    alertFrequency: ALERT_FREQ,
  };
  const fetcher = new Fetcher(mockProvider as any, mockNetworkManager as any);

  beforeAll(async () => {
    await fetcher.setContracts();
  });

  beforeEach(async () => {
    jest.resetModules();
    const BOT = require("./agent"); // Done to re-initialize ALERTS struct.
    handleBlock = BOT.provideHandleBlock(fetcher);
  });

  it("returns empty findings if reserves are less than target reserves", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);
    for (let addr of TEST_ADDRESSES) {
      createTargetReservesCall(addr, BigNumber.from(100));
      createGetReservesCall(addr, BigNumber.from(80));
    }

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if reserves are negative", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    for (let addr of TEST_ADDRESSES) {
      createTargetReservesCall(addr, BigNumber.from(100));
      createGetReservesCall(addr, BigNumber.from(-200));
    }
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if Reserves == targetReserves in one comet contract", async () => {
    let reservesValue: BigNumber = BigNumber.from(200);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      createTargetReservesCall(TEST_ADDRESSES[i], BigNumber.from(100));
      createGetReservesCall(TEST_ADDRESSES[i], BigNumber.from(50));
    }
    createTargetReservesCall(testConfig.cometAddresses[0], reservesValue);
    createGetReservesCall(testConfig.cometAddresses[0], reservesValue);

    const findings = await handleBlock(blockEvent);
    expect(JSON.stringify(findings)).toStrictEqual(
      JSON.stringify([
        Finding.from({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: reservesValue.toString(),
          },
        }),
      ])
    );
  });

  it("returns a finding if Reserves > targetReserves in one comet contract", async () => {
    let reservesValue: BigNumber = BigNumber.from(500);
    let targetReservesValue: BigNumber = BigNumber.from(200);

    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      createTargetReservesCall(TEST_ADDRESSES[i], BigNumber.from(100));
      createGetReservesCall(TEST_ADDRESSES[i], BigNumber.from(50));
    }
    createTargetReservesCall(testConfig.cometAddresses[0], targetReservesValue);
    createGetReservesCall(testConfig.cometAddresses[0], reservesValue);

    const findings = await handleBlock(blockEvent);

    expect(JSON.stringify(findings)).toStrictEqual(
      JSON.stringify([
        Finding.fromObject({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        }),
      ])
    );
  });

  it("returns one finding if Reserves > targetReserves and time limit not reached", async () => {
    let reservesValue: BigNumber = BigNumber.from(500);
    let targetReservesValue: BigNumber = BigNumber.from(200);

    // First Block
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      createTargetReservesCall(TEST_ADDRESSES[i], BigNumber.from(100));
      createGetReservesCall(TEST_ADDRESSES[i], BigNumber.from(50));
    }

    createTargetReservesCall(testConfig.cometAddresses[0], targetReservesValue);
    createGetReservesCall(testConfig.cometAddresses[0], reservesValue);

    // Next Block
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setNumber(11)
      .setTimestamp(
        blockEvent.block.timestamp + testConfig.alertFrequency - 10
      );

    let findings = await handleBlock(blockEvent);
    findings.concat(await handleBlock(blockEvent2));

    expect(findings.toString()).toStrictEqual(
      [
        Finding.from({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        }),
      ].toString()
    );
  });

  it("returns second finding if Reserves > targetReserves and time limit reached", async () => {
    let reservesValue: BigNumber = BigNumber.from(500);
    let targetReservesValue: BigNumber = BigNumber.from(200);

    // First Block
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    createTargetReservesCall(testConfig.cometAddresses[0], targetReservesValue);
    createGetReservesCall(testConfig.cometAddresses[0], reservesValue);
    let findings = await handleBlock(blockEvent);

    // Next Block
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setNumber(11)
      .setTimestamp(
        blockEvent.block.timestamp + testConfig.alertFrequency + 10
      );

    createTargetReservesCall(
      testConfig.cometAddresses[0],
      targetReservesValue.add(200)
    );
    createGetReservesCall(testConfig.cometAddresses[0], reservesValue.add(200));

    findings = findings.concat(await handleBlock(blockEvent2));

    expect(findings.toString()).toStrictEqual(
      [
        Finding.from({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        }),
        Finding.from({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: testConfig.cometAddresses[0],
            reserves: reservesValue.add(200).toString(),
            targetReserves: targetReservesValue.add(200).toString(),
          },
        }),
      ].toString()
    );
  });

  it("returns findings for multiple comet contracts", async () => {
    let reservesValue: BigNumber = BigNumber.from(500);
    let targetReservesValue: BigNumber = BigNumber.from(200);

    // First Block
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(10)
      .setTimestamp(INIT_TIMESTAMP);

    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      createTargetReservesCall(TEST_ADDRESSES[i], targetReservesValue);
      createGetReservesCall(TEST_ADDRESSES[i], reservesValue);
    }

    createTargetReservesCall(testConfig.cometAddresses[0], BigNumber.from(100));
    createGetReservesCall(testConfig.cometAddresses[0], BigNumber.from(50));

    let findings = await handleBlock(blockEvent);

    // Next Block
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setNumber(11)
      .setTimestamp(
        blockEvent.block.timestamp + testConfig.alertFrequency + 10
      );

    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      createTargetReservesCall(TEST_ADDRESSES[i], targetReservesValue.add(200));
      createGetReservesCall(TEST_ADDRESSES[i], reservesValue.add(200));
    }

    findings = findings.concat(await handleBlock(blockEvent2));
    const expectedFindings = [];
    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      expectedFindings.push(
        Finding.from({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: TEST_ADDRESSES[i],
            reserves: reservesValue.toString(),
            targetReserves: targetReservesValue.toString(),
          },
        })
      );
    }
    for (let i = 1; i < TEST_ADDRESSES.length; i++) {
      expectedFindings.push(
        Finding.from({
          name: `Comet reserves reached targetReserves`,
          description: `Reserves on comet contract are >= target reserves`,
          alertId: "COMP-1",
          protocol: "Compound",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            comet: TEST_ADDRESSES[i],
            reserves: reservesValue.add(200).toString(),
            targetReserves: targetReservesValue.add(200).toString(),
          },
        })
      );
    }
    expect(findings.toString()).toStrictEqual(expectedFindings.toString());
  });
});

function createGetReservesCall(comet: string, reserves: BigNumber) {
  return mockProvider.addCallTo(comet, "latest", IFACE, "getReserves", {
    inputs: [],
    outputs: [reserves],
  });
}
function createTargetReservesCall(comet: string, targetReserves: BigNumber) {
  return mockProvider.addCallTo(comet, "latest", IFACE, "targetReserves", {
    inputs: [],
    outputs: [targetReserves],
  });
}
