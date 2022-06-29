import { ethers, Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { POOL_REGISTERED_ABI } from "./constants";
import { AgentConfig, PoolSpecialization } from "./utils";

const createChecksumAddress = (address: string): string => ethers.utils.getAddress(createAddress(address.toString()));
const createBytes32 = (value: string): string => ethers.utils.hexZeroPad(value, 32);

const VAULT_IFACE = new ethers.utils.Interface([POOL_REGISTERED_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const VAULT_ADDRESS = createChecksumAddress("0xdef1");

const DEFAULT_CONFIG: AgentConfig = {
  vaultAddress: VAULT_ADDRESS,
};

const getPoolRegisteredLog = (
  emitter: string,
  block: number,
  poolId: string,
  poolAddress: string,
  specialization: PoolSpecialization
): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...VAULT_IFACE.encodeEventLog(VAULT_IFACE.getEvent("PoolRegistered"), [poolId, poolAddress, specialization]),
  } as ethers.providers.Log;
};

const getIrrelevantEventLog = (emitter: string, block: number): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("Event"), []),
  } as ethers.providers.Log;
};

export function createFinding(poolId: string, poolAddress: string, specialization: string): Finding {
  return Finding.from({
    name: "Pool registered",
    description: "A pool register was detected",
    alertId: "BAL-6",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      poolId,
      poolAddress,
      specialization,
    },
  });
}

const ADDRESSES = new Array(10).fill("").map((_, idx) => createChecksumAddress(`0x${(idx + 1).toString(16)}`));

describe("Balancer Pool Registered Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let handleBlock: HandleBlock;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    handleBlock = provideHandleBlock(DEFAULT_CONFIG, provider);
  });

  it("should return empty findings with an empty logs list", async () => {
    const blockEvent = new TestBlockEvent();

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([
      getPoolRegisteredLog(ADDRESSES[0], 0, createBytes32("0x0"), ADDRESSES[1], PoolSpecialization.GENERAL),
      getPoolRegisteredLog(ADDRESSES[0], 0, createBytes32("0x0"), ADDRESSES[1], PoolSpecialization.MINIMAL_SWAP_INFO),
      getPoolRegisteredLog(ADDRESSES[0], 0, createBytes32("0x0"), ADDRESSES[1], PoolSpecialization.TWO_TOKEN),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore other events emitted from target contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([getIrrelevantEventLog(VAULT_ADDRESS, 0)]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from target contract in other blocks", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([
      getPoolRegisteredLog(VAULT_ADDRESS, 0, createBytes32("0x0"), ADDRESSES[1], PoolSpecialization.GENERAL),
      getPoolRegisteredLog(VAULT_ADDRESS, 2, createBytes32("0x0"), ADDRESSES[1], PoolSpecialization.GENERAL),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should return a finding when there is a pool register at Vault", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([
      getPoolRegisteredLog(VAULT_ADDRESS, 0, createBytes32("0x0"), ADDRESSES[0], PoolSpecialization.GENERAL),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([createFinding(createBytes32("0x0"), ADDRESSES[0], "GENERAL")]);
  });

  it("should return one finding for each pool register at Vault", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([
      getPoolRegisteredLog(VAULT_ADDRESS, 0, createBytes32("0x0"), ADDRESSES[0], PoolSpecialization.GENERAL),
      getPoolRegisteredLog(VAULT_ADDRESS, 0, createBytes32("0x1"), ADDRESSES[1], PoolSpecialization.MINIMAL_SWAP_INFO),
      getPoolRegisteredLog(VAULT_ADDRESS, 0, createBytes32("0x2"), ADDRESSES[2], PoolSpecialization.TWO_TOKEN),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([
      createFinding(createBytes32("0x0"), ADDRESSES[0], "GENERAL"),
      createFinding(createBytes32("0x1"), ADDRESSES[1], "MINIMAL_SWAP_INFO"),
      createFinding(createBytes32("0x2"), ADDRESSES[2], "TWO_TOKEN"),
    ]);
  });
});
