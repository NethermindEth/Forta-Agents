import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { TOKEN_ABI, FLASH_LOAN_ABI } from "./constants";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import BigNumber from "bignumber.js";
import { AgentConfig, NetworkData, SmartCaller, toBn } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";

const createChecksumAddress = (address: string): string => ethers.utils.getAddress(createAddress(address.toString()));

const VAULT_IFACE = new ethers.utils.Interface([FLASH_LOAN_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const TOKEN_IFACE = new ethers.utils.Interface(TOKEN_ABI);
const VAULT_ADDRESS = createChecksumAddress("0xdef1");

const createFinding = (
  recipient: string,
  token: string,
  symbol: string,
  decimals: number,
  amount: BigNumber,
  tvlPercentage: BigNumber | string
): Finding => {
  return Finding.from({
    name: "Large flash loan",
    description: `A flash loan to ${recipient} of ${amount
      .shiftedBy(-decimals)
      .decimalPlaces(3)} ${symbol}, was detected. The amount made up ${tvlPercentage}% of the TVL.`,
    alertId: "BAL-4",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      recipient,
      token,
      symbol,
      amount: amount.toString(),
      tvlPercentage: new BigNumber(tvlPercentage).toString(10),
    },
  });
};

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    vaultAddress: VAULT_ADDRESS,
    tvlPercentageThreshold: "50.5",
  },
};

const ADDRESSES = new Array(10).fill("").map((_, idx) => createChecksumAddress(`0x${(idx + 1).toString(16)}`));

describe("Balancer Large Flash Loan Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  const setBalanceOf = (block: number, token: string, account: string, balance: ethers.BigNumberish) => {
    mockProvider.addCallTo(token, block, TOKEN_IFACE, "balanceOf", {
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
    const txEvent = new TestTransactionEvent().setBlock(0);

    expect(await handleTransaction(txEvent));
  });

  it("should ignore target events emitted from another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), ADDRESSES[0], [
        ADDRESSES[1],
        ADDRESSES[2],
        ethers.BigNumber.from("0"),
        ethers.BigNumber.from("0"),
      ])
      .setBlock(0);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should ignore other events emitted from target contract", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("Event"), VAULT_ADDRESS)
      .setBlock(0);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should not return findings for flash loans that are not large", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[1],
        ADDRESSES[0],
        ethers.BigNumber.from("1"),
        ethers.BigNumber.from("0"),
      ])
      .setBlock(1);

    setBalanceOf(0, ADDRESSES[0], VAULT_ADDRESS, "10000");

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should return a finding for a large flash loan", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[1],
        ADDRESSES[0],
        ethers.BigNumber.from("5050"),
        ethers.BigNumber.from("0"),
      ])
      .setBlock(1);

    setBalanceOf(0, ADDRESSES[0], VAULT_ADDRESS, "10000");
    setSymbol(1, ADDRESSES[0], "TOKEN0");
    setDecimals(1, ADDRESSES[0], ethers.BigNumber.from("18"));

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(ADDRESSES[1], ADDRESSES[0], "TOKEN0", 18, new BigNumber("5050"), "50.5"),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(3);
  });

  it("should return one finding for each large flash loan", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[2],
        ADDRESSES[0],
        ethers.BigNumber.from("5051"),
        ethers.BigNumber.from("0"),
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[3],
        ADDRESSES[0],
        ethers.BigNumber.from("5050"),
        ethers.BigNumber.from("0"),
      ])
      // no finding
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[4],
        ADDRESSES[0],
        ethers.BigNumber.from("5049"),
        ethers.BigNumber.from("0"),
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[5],
        ADDRESSES[1],
        ethers.BigNumber.from("10101"),
        ethers.BigNumber.from("0"),
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[6],
        ADDRESSES[1],
        ethers.BigNumber.from("10100"),
        ethers.BigNumber.from("0"),
      ])
      // no finding
      .addInterfaceEventLog(VAULT_IFACE.getEvent("FlashLoan"), VAULT_ADDRESS, [
        ADDRESSES[7],
        ADDRESSES[1],
        ethers.BigNumber.from("10099"),
        ethers.BigNumber.from("0"),
      ])
      .setBlock(1);

    setBalanceOf(0, ADDRESSES[0], VAULT_ADDRESS, "10000");
    setBalanceOf(0, ADDRESSES[1], VAULT_ADDRESS, "20000");

    setSymbol(1, ADDRESSES[0], "TOKEN0");
    setSymbol(1, ADDRESSES[1], "TOKEN1");

    setDecimals(1, ADDRESSES[0], ethers.BigNumber.from("18"));
    setDecimals(1, ADDRESSES[1], ethers.BigNumber.from("18"));

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(ADDRESSES[2], ADDRESSES[0], "TOKEN0", 18, new BigNumber("5051"), "50.51"),
      createFinding(ADDRESSES[3], ADDRESSES[0], "TOKEN0", 18, new BigNumber("5050"), "50.5"),
      createFinding(ADDRESSES[5], ADDRESSES[1], "TOKEN1", 18, new BigNumber("10101"), "50.505"),
      createFinding(ADDRESSES[6], ADDRESSES[1], "TOKEN1", 18, new BigNumber("10100"), "50.5"),
    ]);
    // only 2 balanceOf calls
    expect(mockProvider.call).toHaveBeenCalledTimes(6);
  });
});
