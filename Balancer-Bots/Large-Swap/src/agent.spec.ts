import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { createAddress as padAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { BALANCE_OF_ABI, SWAP_ABI } from "./constants";
import { AgentConfig, NetworkData, SmartCaller } from "./utils";

const createAddress = (address: string): string => ethers.utils.getAddress(padAddress(address.toLowerCase()));

const VAULT_IFACE = new ethers.utils.Interface([SWAP_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const TOKEN_IFACE = new ethers.utils.Interface([BALANCE_OF_ABI]);
const VAULT_ADDRESS = createAddress("0xdef1");

const getSwapLog = (
  emitter: string,
  block: number,
  poolId: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: ethers.BigNumberish,
  amountOut: ethers.BigNumberish
): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...VAULT_IFACE.encodeEventLog(VAULT_IFACE.getEvent("Swap"), [
      ethers.utils.hexZeroPad(poolId, 32),
      tokenIn,
      tokenOut,
      ethers.BigNumber.from(amountIn),
      ethers.BigNumber.from(amountOut),
    ]),
  } as ethers.providers.Log;
};

const getIrrelevantEvent = (emitter: string, block: number): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("Event"), []),
  } as ethers.providers.Log;
};

const createFinding = (
  poolId: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: ethers.BigNumberish,
  amountOut: ethers.BigNumberish,
  percentageIn: BigNumber | string,
  percentageOut: BigNumber | string
): Finding => {
  return Finding.from({
    name: "Large swap",
    description: `A swap of ${amountIn} tokens, of token address ${tokenIn} (${percentageIn}% of token's balance) for ${amountOut} tokens, of token address ${tokenOut} (${percentageOut}% of token's balance) was detected. The poolId is ${poolId}.`,
    alertId: "BAL-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      poolId,
      tokenIn,
      tokenOut,
      amountIn: ethers.BigNumber.from(amountIn).toString(),
      amountOut: ethers.BigNumber.from(amountOut).toString(),
      percentageIn: new BigNumber(percentageIn).toString(10),
      percentageOut: new BigNumber(percentageOut).toString(10),
    },
  });
};

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    vaultAddress: VAULT_ADDRESS,
    tvlPercentageThreshold: "50.5",
  },
};

describe("Balancer Large Swap Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  const setBalanceOf = (block: number, tokenAddress: string, account: string, balance: ethers.BigNumberish) => {
    mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "balanceOf", {
      inputs: [account],
      outputs: [ethers.BigNumber.from(balance)],
    });
  };

  beforeEach(() => {
    SmartCaller.clearCache();
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
    handleTransaction = provideHandleTransaction(networkManager, provider);
  });

  it("should return empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent();

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const txEvent = new TestTransactionEvent().addInterfaceEventLog(
      VAULT_IFACE.getEvent("Swap"),
      createAddress("0x1"),
      [ethers.utils.hexZeroPad("0x2", 32), createAddress("0x3"), createAddress("0x4"), "5", "6"]
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore other events emitted from target contract", async () => {
    const txEvent = new TestTransactionEvent().addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("Event"), VAULT_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should not return findings for swaps that are not large", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5",
        "6",
      ])
      .setBlock(1);
    setBalanceOf(0, createAddress("0x3"), VAULT_ADDRESS, "10000");
    setBalanceOf(0, createAddress("0x4"), VAULT_ADDRESS, "10000");

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("should return findings for swaps that are large (i.e. any of the tokens' swap amount is above the threshold relative to the Vault's balance)", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5",
        "0",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "0",
        "6",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5",
        "6",
      ])
      .setBlock(1);

    setBalanceOf(0, createAddress("0x3"), VAULT_ADDRESS, "5");
    setBalanceOf(0, createAddress("0x4"), VAULT_ADDRESS, "6");

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5",
        "0",
        "100",
        "0"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "0",
        "6",
        "0",
        "100"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5",
        "6",
        "100",
        "100"
      ),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("should return one finding for each large swap", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0xa1"),
        createAddress("0xb1"),
        "5",
        "6",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0xa2"),
        createAddress("0xb2"),
        "5",
        "6",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0xa3"),
        createAddress("0xb3"),
        "5",
        "6",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x4", 32),
        createAddress("0xa4"),
        createAddress("0xb4"),
        "5",
        "6",
      ])
      .setBlock(1);

    setBalanceOf(0, createAddress("0xa1"), VAULT_ADDRESS, "5");
    setBalanceOf(0, createAddress("0xb1"), VAULT_ADDRESS, "6");

    setBalanceOf(0, createAddress("0xa2"), VAULT_ADDRESS, "5");
    setBalanceOf(0, createAddress("0xb2"), VAULT_ADDRESS, "6");

    setBalanceOf(0, createAddress("0xa3"), VAULT_ADDRESS, "5");
    setBalanceOf(0, createAddress("0xb3"), VAULT_ADDRESS, "6");

    setBalanceOf(0, createAddress("0xa4"), VAULT_ADDRESS, "10000");
    setBalanceOf(0, createAddress("0xb4"), VAULT_ADDRESS, "10000");

    mockProvider.addLogs([
      getSwapLog(VAULT_ADDRESS, 1, "0x1", createAddress("0xa1"), createAddress("0xb1"), "5", "6"),
      getSwapLog(VAULT_ADDRESS, 1, "0x2", createAddress("0xa2"), createAddress("0xb2"), "5", "6"),
      getSwapLog(VAULT_ADDRESS, 1, "0x3", createAddress("0xa3"), createAddress("0xb3"), "5", "6"),
      getSwapLog(VAULT_ADDRESS, 1, "0x4", createAddress("0xa4"), createAddress("0xb4"), "5", "6"),
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0xa1"),
        createAddress("0xb1"),
        "5",
        "6",
        "100",
        "100"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0xa2"),
        createAddress("0xb2"),
        "5",
        "6",
        "100",
        "100"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0xa3"),
        createAddress("0xb3"),
        "5",
        "6",
        "100",
        "100"
      ),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(8);
  });
});
