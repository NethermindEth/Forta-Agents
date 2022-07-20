import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { createAddress as padAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { TOKEN_ABI, SWAP_ABI } from "./constants";
import { AgentConfig, NetworkData, SmartCaller } from "./utils";

const createAddress = (address: string): string => ethers.utils.getAddress(padAddress(address.toLowerCase()));

const VAULT_IFACE = new ethers.utils.Interface([SWAP_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const TOKEN_IFACE = new ethers.utils.Interface(TOKEN_ABI);
const VAULT_ADDRESS = createAddress("0xdef1");

const createFinding = (
  poolId: string,
  tokenIn: string,
  tokenInSymbol: string,
  tokenInDecimals: number,
  tokenOut: string,
  tokenOutSymbol: string,
  tokenOutDecimals: number,
  amountIn: BigNumber,
  amountOut: BigNumber,
  percentageIn: BigNumber | string,
  percentageOut: BigNumber | string
): Finding => {
  return Finding.from({
    name: "Large swap",
    description: `A swap of ${amountIn
      .shiftedBy(-tokenInDecimals)
      .decimalPlaces(3)} ${tokenInSymbol}, (${percentageIn}% of ${tokenInSymbol}'s balance) for ${amountOut
      .shiftedBy(-tokenOutDecimals)
      .decimalPlaces(
        3
      )} ${tokenOutSymbol} (${percentageOut}% of ${tokenOutSymbol}'s balance) was detected. The poolId is ${poolId}.`,
    alertId: "BAL-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      poolId,
      tokenIn,
      tokenInSymbol,
      tokenOut,
      tokenOutSymbol,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
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

  const setSymbol = (block: number, tokenAddress: string, symbol: string) => {
    mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: [symbol],
    });
  };

  const setDecimals = (block: number, tokenAddress: string, decimals: ethers.BigNumberish) => {
    mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [decimals],
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
      [
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5000000000000000000",
        "6000000000000000000",
      ]
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
        "5000000000000000000",
        "6000000000000000000",
      ])
      .setBlock(1);
    setBalanceOf(0, createAddress("0x3"), VAULT_ADDRESS, "10000000000000000000000");
    setBalanceOf(0, createAddress("0x4"), VAULT_ADDRESS, "10000000000000000000000");

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("should return findings for swaps that are large (i.e. any of the tokens' swap amount is above the threshold relative to the Vault's balance)", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5000000000000000000",
        "0",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "0",
        "6000000000000000000",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0x3"),
        createAddress("0x4"),
        "5000000000000000000",
        "6000000000000000000",
      ])
      .setBlock(1);

    setBalanceOf(0, createAddress("0x3"), VAULT_ADDRESS, "5000000000000000000");
    setBalanceOf(0, createAddress("0x4"), VAULT_ADDRESS, "6000000000000000000");

    setSymbol(1, createAddress("0x3"), "TOKEN1");
    setSymbol(1, createAddress("0x4"), "TOKEN2");

    setDecimals(1, createAddress("0x3"), ethers.BigNumber.from("18"));
    setDecimals(1, createAddress("0x4"), ethers.BigNumber.from("18"));

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0x3"),
        "TOKEN1",
        18,
        createAddress("0x4"),
        "TOKEN2",
        18,
        new BigNumber("5000000000000000000"),
        new BigNumber(0),
        "100",
        "0"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0x3"),
        "TOKEN1",
        18,
        createAddress("0x4"),
        "TOKEN2",
        18,
        new BigNumber("0"),
        new BigNumber("6000000000000000000"),
        "0",
        "100"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0x3"),
        "TOKEN1",
        18,
        createAddress("0x4"),
        "TOKEN2",
        18,
        new BigNumber("5000000000000000000"),
        new BigNumber("6000000000000000000"),
        "100",
        "100"
      ),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(6);
  });

  it("should return one finding for each large swap", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0xa1"),
        createAddress("0xb1"),
        "5000000000000000000",
        "6000000000000000000",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0xa2"),
        createAddress("0xb2"),
        "5000000000000000000",
        "6000000000000000000",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0xa3"),
        createAddress("0xb3"),
        "5000000000000000000",
        "6000000000000000000",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Swap"), VAULT_ADDRESS, [
        ethers.utils.hexZeroPad("0x4", 32),
        createAddress("0xa4"),
        createAddress("0xb4"),
        "5000000000000000000",
        "6000000000000000000",
      ])
      .setBlock(1);

    setBalanceOf(0, createAddress("0xa1"), VAULT_ADDRESS, "5000000000000000000");
    setBalanceOf(0, createAddress("0xb1"), VAULT_ADDRESS, "6000000000000000000");
    setSymbol(1, createAddress("0xa1"), "TOKENA1");
    setSymbol(1, createAddress("0xb1"), "TOKENB1");
    setDecimals(1, createAddress("0xa1"), ethers.BigNumber.from("18"));
    setDecimals(1, createAddress("0xb1"), ethers.BigNumber.from("18"));

    setBalanceOf(0, createAddress("0xa2"), VAULT_ADDRESS, "5000000000000000000");
    setBalanceOf(0, createAddress("0xb2"), VAULT_ADDRESS, "6000000000000000000");
    setSymbol(1, createAddress("0xa2"), "TOKENA2");
    setSymbol(1, createAddress("0xb2"), "TOKENB2");
    setDecimals(1, createAddress("0xa2"), ethers.BigNumber.from("18"));
    setDecimals(1, createAddress("0xb2"), ethers.BigNumber.from("18"));

    setBalanceOf(0, createAddress("0xa3"), VAULT_ADDRESS, "5000000000000000000");
    setBalanceOf(0, createAddress("0xb3"), VAULT_ADDRESS, "6000000000000000000");
    setSymbol(1, createAddress("0xa3"), "TOKENA3");
    setSymbol(1, createAddress("0xb3"), "TOKENB3");
    setDecimals(1, createAddress("0xa3"), ethers.BigNumber.from("18"));
    setDecimals(1, createAddress("0xb3"), ethers.BigNumber.from("18"));

    setBalanceOf(0, createAddress("0xa4"), VAULT_ADDRESS, "10000000000000000000000");
    setBalanceOf(0, createAddress("0xb4"), VAULT_ADDRESS, "10000000000000000000000");

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        ethers.utils.hexZeroPad("0x1", 32),
        createAddress("0xa1"),
        "TOKENA1",
        18,
        createAddress("0xb1"),
        "TOKENB1",
        18,
        new BigNumber("5000000000000000000"),
        new BigNumber("6000000000000000000"),
        "100",
        "100"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x2", 32),
        createAddress("0xa2"),
        "TOKENA2",
        18,
        createAddress("0xb2"),
        "TOKENB2",
        18,
        new BigNumber("5000000000000000000"),
        new BigNumber("6000000000000000000"),
        "100",
        "100"
      ),
      createFinding(
        ethers.utils.hexZeroPad("0x3", 32),
        createAddress("0xa3"),
        "TOKENA3",
        18,
        createAddress("0xb3"),
        "TOKENB3",
        18,
        new BigNumber("5000000000000000000"),
        new BigNumber("6000000000000000000"),
        "100",
        "100"
      ),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(20);
  });
});
