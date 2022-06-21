import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, Network } from "forta-agent";
import { BALANCE_OF_ABI, FLASH_LOAN_ABI } from "./constants";
import { createAddress, MockEthersProvider, TestBlockEvent as _TestBlockEvent } from "forta-agent-tools/lib/tests";
import BigNumber from "bignumber.js";
import { AgentConfig, NetworkData, SmartCaller } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { provideHandleBlock } from "./agent";

const createChecksumAddress = (address: string): string => ethers.utils.getAddress(createAddress(address.toString()));

const VAULT_IFACE = new ethers.utils.Interface([FLASH_LOAN_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const TOKEN_IFACE = new ethers.utils.Interface([BALANCE_OF_ABI]);
const VAULT_ADDRESS = createChecksumAddress("0xdef1");

class TestBlockEvent extends _TestBlockEvent {
  constructor(network?: Network) {
    super(network);
  }

  public setParentHash(blockHash: string) {
    this.block.parentHash = blockHash;
    return this;
  }

  public setNumber(blockNumber: number) {
    this.block.number = blockNumber;
    return this;
  }
}

const getFlashLoanLog = (
  emitter: string,
  block: number,
  recipient: string,
  token: string,
  amount: ethers.BigNumberish
): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...VAULT_IFACE.encodeEventLog(VAULT_IFACE.getEvent("FlashLoan"), [
      recipient,
      token,
      ethers.BigNumber.from(amount),
      ethers.BigNumber.from(0),
    ]),
  } as ethers.providers.Log;
};

const getIrrelevantEventLog = (emitter: string, block: number): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("Event"), []),
  } as ethers.providers.Log;
};

const createFinding = (
  recipient: string,
  token: string,
  amount: ethers.BigNumberish,
  tvlPercentage: BigNumber | string
): Finding => {
  return Finding.from({
    name: "Large flash loan",
    description: "A flash loan that involved a significant percentage of a token's balance was detected",
    alertId: "BAL-4",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      recipient,
      token,
      amount: ethers.BigNumber.from(amount).toString(),
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
  let handleBlock: HandleBlock;

  const setBalanceOf = (blockHash: string, token: string, account: string, balance: ethers.BigNumberish) => {
    mockProvider.addCallTo(token, blockHash, TOKEN_IFACE, "balanceOf", {
      inputs: [account],
      outputs: [ethers.BigNumber.from(balance)],
    });
  };

  beforeEach(() => {
    SmartCaller.clearCache();
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
    handleBlock = provideHandleBlock(networkManager, provider);
  });

  it("should return empty findings with an empty logs list", async () => {
    const blockEvent = new TestBlockEvent(Network.MAINNET);

    expect(await handleBlock(blockEvent));
  });

  it("should ignore target events emitted from another contract", async () => {
    const blockEvent = new TestBlockEvent(Network.MAINNET).setNumber(0);

    mockProvider.addLogs([getFlashLoanLog(ADDRESSES[0], 0, ADDRESSES[1], ADDRESSES[2], "0")]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should ignore other events emitted from target contract", async () => {
    const blockEvent = new TestBlockEvent(Network.MAINNET).setNumber(0);

    mockProvider.addLogs([getIrrelevantEventLog(VAULT_ADDRESS, 0)]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should not return findings for flash loans that are not large", async () => {
    const blockEvent = new TestBlockEvent(Network.MAINNET).setNumber(1).setParentHash("0xf00d");

    setBalanceOf("0xf00d", ADDRESSES[0], VAULT_ADDRESS, "10000");

    mockProvider.addLogs([getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[1], ADDRESSES[0], "1")]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should return a finding for a large flash loan", async () => {
    const blockEvent = new TestBlockEvent(Network.MAINNET).setNumber(1).setParentHash("0xf00d");

    setBalanceOf("0xf00d", ADDRESSES[0], VAULT_ADDRESS, "10000");

    mockProvider.addLogs([getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[1], ADDRESSES[0], "5050")]);

    expect(await handleBlock(blockEvent)).toStrictEqual([createFinding(ADDRESSES[1], ADDRESSES[0], "5050", "50.5")]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should return one finding for each large flash loan", async () => {
    const blockEvent = new TestBlockEvent(Network.MAINNET).setNumber(1).setParentHash("0xf00d");

    setBalanceOf("0xf00d", ADDRESSES[0], VAULT_ADDRESS, "10000");
    setBalanceOf("0xf00d", ADDRESSES[1], VAULT_ADDRESS, "20000");

    mockProvider.addLogs([
      getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[2], ADDRESSES[0], "5051"),
      getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[3], ADDRESSES[0], "5050"),
      getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[4], ADDRESSES[0], "5049"), // no finding
      getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[5], ADDRESSES[1], "10101"),
      getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[6], ADDRESSES[1], "10100"),
      getFlashLoanLog(VAULT_ADDRESS, 1, ADDRESSES[7], ADDRESSES[1], "10099"), // no finding
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([
      createFinding(ADDRESSES[2], ADDRESSES[0], "5051", "50.51"),
      createFinding(ADDRESSES[3], ADDRESSES[0], "5050", "50.50"),
      createFinding(ADDRESSES[5], ADDRESSES[1], "10101", "50.505"),
      createFinding(ADDRESSES[6], ADDRESSES[1], "10100", "50.50"),
    ]);
    // only 2 balanceOf calls
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });
});
