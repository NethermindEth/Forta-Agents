import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
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

export function createFinding(poolId: string, poolAddress: string, specialization: string): Finding {
  return Finding.from({
    name: "Pool registered",
    description: `A pool was registered with ID: ${poolId}, address: ${poolAddress}, and specialization: ${specialization}`,
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
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);
  });

  it("should return empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent();

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolRegistered"), ADDRESSES[0], [
        createBytes32("0x0"),
        ADDRESSES[1],
        PoolSpecialization.GENERAL,
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolRegistered"), ADDRESSES[0], [
        createBytes32("0x0"),
        ADDRESSES[1],
        PoolSpecialization.MINIMAL_SWAP_INFO,
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolRegistered"), ADDRESSES[0], [
        createBytes32("0x0"),
        ADDRESSES[1],
        PoolSpecialization.TWO_TOKEN,
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore other events emitted from target contract", async () => {
    const txEvent = new TestTransactionEvent().addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("Event"), VAULT_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return a finding when there is a pool register at Vault", async () => {
    const txEvent = new TestTransactionEvent().addInterfaceEventLog(
      VAULT_IFACE.getEvent("PoolRegistered"),
      VAULT_ADDRESS,
      [createBytes32("0x0"), ADDRESSES[0], PoolSpecialization.GENERAL]
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(createBytes32("0x0"), ADDRESSES[0], "GENERAL"),
    ]);
  });

  it("should return one finding for each pool register at Vault", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolRegistered"), VAULT_ADDRESS, [
        createBytes32("0x0"),
        ADDRESSES[0],
        PoolSpecialization.GENERAL,
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolRegistered"), VAULT_ADDRESS, [
        createBytes32("0x1"),
        ADDRESSES[1],
        PoolSpecialization.MINIMAL_SWAP_INFO,
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolRegistered"), VAULT_ADDRESS, [
        createBytes32("0x2"),
        ADDRESSES[2],
        PoolSpecialization.TWO_TOKEN,
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(createBytes32("0x0"), ADDRESSES[0], "GENERAL"),
      createFinding(createBytes32("0x1"), ADDRESSES[1], "MINIMAL_SWAP_INFO"),
      createFinding(createBytes32("0x2"), ADDRESSES[2], "TWO_TOKEN"),
    ]);
  });
});
