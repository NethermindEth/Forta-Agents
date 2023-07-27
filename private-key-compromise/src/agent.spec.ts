import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Network,
  Label,
  EntityType,
  Initialize,
  ethers,
} from "forta-agent";
import { Interface } from "@ethersproject/abi";

import { TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { provideInitialize, provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import fetch, { Response } from "node-fetch";
import { AgentConfig, NetworkData, ERC20_TRANSFER_FUNCTION, TOKEN_ABI } from "./utils";
import BalanceFetcher from "./balance.fetcher";

jest.mock("node-fetch");
const BALANCE_IFACE = new Interface([TOKEN_ABI[0]]);

const mockChainId = 1;
const mockJwt = "MOCK_JWT";

const mockDBKeys = {
  transfersKey: "mock-pk-comp-value-bot-key",
  alertedAddressesKey: "mock-pk-comp-bot-alerted-addresses-key",
  queuedAddressesKey: "mock-pk-comp-bot-queued-addresses-key",
};

const senders = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
  createAddress("0x4"),
  createAddress("0x5"),
];

const receivers = [createAddress("0x11"), createAddress("0x12"), createAddress("0x13"), createAddress("0x14")];

const mockpKCompValueTxns = {};

const mockpKCompAlertedAddresses: any = [];
const mockpKCompQueuedAddresses: any = [
  {
    timestamp: 1,
    transfer: {
      from: "0x0000000000000000000000000000000000000001",
      to: "0x0000000000000000000000000000000000000014",
      txHash: "0x",
      asset: "ETH",
    },
  },
  {
    timestamp: 1,
    transfer: {
      from: "0x0000000000000000000000000000000000000002",
      to: "0x0000000000000000000000000000000000000014",
      txHash: "0x",
      asset: "ETH",
    },
  },
  {
    timestamp: 1,
    transfer: {
      from: "0x0000000000000000000000000000000000000003",
      to: "0x0000000000000000000000000000000000000014",
      txHash: "0x",
      asset: "0x0000000000000000000000000000000000000099",
    },
  },
  {
    timestamp: 1,
    transfer: {
      from: "0x0000000000000000000000000000000000000004",
      to: "0x0000000000000000000000000000000000000014",
      txHash: "0x",
      asset: "ETH",
    },
  },
];

// Mock calculateAlertRate function of the bot-alert-rate module
const mockCalculateAlertRate = jest.fn();
jest.mock("bot-alert-rate", () => ({
  ...jest.requireActual("bot-alert-rate"),
  __esModule: true,
  default: () => mockCalculateAlertRate(),
}));

// Mock the fetchJwt function of the forta-agent module
const mockFetchJwt = jest.fn();
jest.mock("forta-agent", () => {
  const original = jest.requireActual("forta-agent");
  return {
    ...original,
    fetchJwt: () => mockFetchJwt(),
  };
});

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    threshold: "0.05",
    tokenName: "ETH",
  },
};

class MockEthersProviderExtension extends MockEthersProvider {
  public getBalance: any;

  constructor() {
    super();
    this.getBalance = jest.fn().mockReturnValue(ethers.BigNumber.from("0"));
  }

  public setBalance(addr: string, block: number, balance: number): MockEthersProviderExtension {
    when(this.getBalance).calledWith(addr, block).mockReturnValue(balance);
    return this;
  }
}

const createFinding = (txHash: string, from: string[], to: string, assets: string[], anomalyScore: number): Finding => {
  const victims = from.map((victim) => {
    return Label.fromObject({
      entity: victim,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.3,
      remove: false,
    });
  });

  return Finding.fromObject({
    name: "Possible private key compromise",
    description: `${from.toString()} transferred funds to ${to}`,
    alertId: "PKC-1",
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victims: from.toString(),
      transferredAssets: assets
        .filter(function (item, pos) {
          return assets.indexOf(item) == pos;
        })
        .toString(),
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.3,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.3,
        remove: false,
      }),
      ...victims,
    ],
  });
};

const createDelayedFinding = (
  txHash: string,
  from: string,
  to: string,
  asset: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Possible private key compromise",
    description: `${from.toString()} transferred funds to ${to} and has been inactive for a week`,
    alertId: "PKC-2",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victims: from.toString(),
      transferredAsset: asset,
      anomalyScore: anomalyScore.toString(),
      txHash,
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: 0.6,
        remove: false,
      }),
    ],
  });
};

describe("Detect Private Key Compromise", () => {
  const mockPersistenceHelper = {
    persist: jest.fn(),
    load: jest.fn(),
  };
  const mockMarketCapFetcher = {
    getTopMarketCap: jest.fn(),
  };
  const mockPriceFetcher = {
    getValueInUsd: jest.fn(),
  };
  let mockProvider: MockEthersProviderExtension;
  let mockFetch = jest.mocked(fetch, true);
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;
  let mockFetchResponse: Response;
  let mockBalanceFetcher: BalanceFetcher;

  const mockContractFetcher = {
    getContractInfo: jest.fn(),
    getVictimInfo: jest.fn(),
    getFundInfo: jest.fn(),
    checkInitialFunder: jest.fn(),
  };

  const mockDataFetcher = {
    isEoa: jest.fn(),
    getSymbol: jest.fn(),
  };

  beforeAll(() => {
    mockProvider = new MockEthersProviderExtension();
    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
  });

  beforeEach(async () => {
    mockProvider.setNetwork(mockChainId);

    initialize = provideInitialize(
      networkManager,
      mockProvider as any,
      mockPersistenceHelper as any,
      mockDBKeys,
      mockMarketCapFetcher as any
    );
    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockCalculateAlertRate.mockResolvedValue("0.1");
    mockFetchJwt.mockResolvedValue(mockJwt);
    mockFetch.mockResolvedValue(mockFetchResponse);
    mockBalanceFetcher = new BalanceFetcher(mockProvider as any);
    mockContractFetcher.checkInitialFunder.mockResolvedValue(true);
    mockPriceFetcher.getValueInUsd.mockResolvedValue(500);

    when(mockPersistenceHelper.load)
      .calledWith(mockDBKeys.transfersKey.concat("-", "1"))
      .mockResolvedValue(mockpKCompValueTxns);

    when(mockPersistenceHelper.load)
      .calledWith(mockDBKeys.alertedAddressesKey.concat("-", "1"))
      .mockResolvedValue(mockpKCompAlertedAddresses);

    when(mockPersistenceHelper.load)
      .calledWith(mockDBKeys.queuedAddressesKey.concat("-", "1"))
      .mockResolvedValue(mockpKCompQueuedAddresses);

    await initialize();

    handleTransaction = provideHandleTransaction(
      mockProvider as any,
      networkManager,
      mockBalanceFetcher,
      mockContractFetcher as any,
      mockDataFetcher as any,
      mockMarketCapFetcher as any,
      mockPriceFetcher as any,
      mockPersistenceHelper as any,
      mockDBKeys
    );

    delete process.env.LOCAL_NODE;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setTokenBalance = (tokenAddr: string, blockNumber: number, accAddr: string, balance: string) => {
    mockProvider.addCallTo(tokenAddr, blockNumber, BALANCE_IFACE, "balanceOf", {
      inputs: [accAddr],
      outputs: [ethers.BigNumber.from(balance)],
    });
  };

  describe("Transaction handler test suite", () => {
    when(mockMarketCapFetcher.getTopMarketCap).calledWith().mockReturnValue(["ABC", "DEF"]);

    it("returns empty findings if there is no native token transfers", async () => {
      const txEvent = new TestTransactionEvent();

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there is 2 native transfers and 0 token transfers to an attacker address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[0]);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[0]);

      txEvent.setValue("110");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
      txEvent2.setValue("200");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are 1 native transfers and 1 token transfer to an attacker address", async () => {
      let findings;

      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[2]);
      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[2], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[2]);

      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");
      when(mockDataFetcher.getSymbol).calledWith(createAddress("0x99"), 1).mockReturnValue("ABC");
      when(mockDataFetcher.isEoa).calledWith(receivers[2]).mockReturnValue(true);

      txEvent2.setValue("200");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are 2 token transfers to an attacker address", async () => {
      let findings;

      const txEvent2 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x98"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[0], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[1]);

      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x98"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[0], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[2]);

      setTokenBalance(createAddress("0x98"), 1, senders[1], "0");
      setTokenBalance(createAddress("0x98"), 1, senders[2], "0");

      when(mockDataFetcher.getSymbol).calledWith(createAddress("0x98"), 1).mockReturnValue("ABC");
      when(mockDataFetcher.isEoa).calledWith(receivers[0]).mockReturnValue(true);

      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
    });

    it("returns findings if there are more than 2 native transfers to a single address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[1]);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[1]);
      const txEvent3 = new TestTransactionEvent().setFrom(senders[2]).setTo(receivers[1]);

      when(mockDataFetcher.isEoa).calledWith(receivers[1]).mockReturnValue(true);

      txEvent.setValue("110");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
      txEvent2.setValue("200");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);
      txEvent3.setValue("300");
      findings = await handleTransaction(txEvent3);

      expect(findings).toStrictEqual([
        createFinding("0x", [senders[0], senders[1], senders[2]], receivers[1], ["ETH"], 0.1),
      ]);
    });

    it("returns findings if there are more than 2 token transfers", async () => {
      let findings;
      const txEvent = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[1], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[0]);

      const txEvent2 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[1], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[1]);

      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[1], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[2]);

      const txEvent4 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[1], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[3]);

      setTokenBalance(createAddress("0x99"), 1, senders[0], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[1], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[3], "0");

      when(mockDataFetcher.isEoa).calledWith(receivers[1]).mockReturnValue(true);
      when(mockDataFetcher.getSymbol).calledWith(createAddress("0x99"), 1).mockReturnValue("ABC");

      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);

      expect(findings).toStrictEqual([
        createFinding("0x", [senders[0], senders[1], senders[2]], receivers[1], [createAddress("0x99")], 0.1),
      ]);

      findings = await handleTransaction(txEvent4);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings if there are 2 native transfers and 1 token transfer to an attacker address", async () => {
      let findings;

      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[2]);
      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[2], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[2]);

      const txEvent4 = new TestTransactionEvent().setFrom(senders[3]).setTo(receivers[2]);

      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");
      when(mockDataFetcher.isEoa).calledWith(receivers[2]).mockReturnValue(true);
      when(mockDataFetcher.getSymbol).calledWith(createAddress("0x99"), 1).mockReturnValue("ABC");

      txEvent2.setValue("200");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);

      txEvent4.setValue("400");
      findings = await handleTransaction(txEvent4);
      expect(findings).toStrictEqual([
        createFinding("0x", [senders[1], senders[2], senders[3]], receivers[2], ["ETH", createAddress("0x99")], 0.1),
      ]);
    });

    it("returns delayed findings if a victim stays inactive for a week", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[3]).setBlock(1).setTimestamp(1);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[3]).setBlock(1).setTimestamp(1);
      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .setTimestamp(1)
        .addTraces({
          to: createAddress("0x99"),
          function: ERC20_TRANSFER_FUNCTION,
          arguments: [receivers[3], ethers.BigNumber.from("1000000")],
          output: [],
        })
        .setFrom(senders[2]);

      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");
      when(mockDataFetcher.isEoa).calledWith(receivers[3]).mockReturnValue(true);
      when(mockDataFetcher.getSymbol).calledWith(createAddress("0x99"), 1).mockReturnValue("ABC");

      txEvent.setValue("110");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);

      txEvent2.setValue("200");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);

      expect(findings).toStrictEqual([
        createFinding("0x", [senders[0], senders[1], senders[2]], receivers[3], ["ETH", createAddress("0x99")], 0.1),
      ]);

      when(mockContractFetcher.getVictimInfo).calledWith(senders[0], 1, 1).mockResolvedValue(false);
      when(mockContractFetcher.getVictimInfo).calledWith(senders[1], 1, 1).mockResolvedValue(false);
      when(mockContractFetcher.getVictimInfo).calledWith(senders[2], 1, 1).mockResolvedValue(false);
      when(mockContractFetcher.getVictimInfo).calledWith(senders[3], 1, 1).mockResolvedValue(false);
      const txEvent5 = new TestTransactionEvent().setBlock(7200).setTimestamp(604900);
      findings = await handleTransaction(txEvent5);

      expect(findings).toStrictEqual([
        createDelayedFinding("0x", senders[0], receivers[3], "ETH", 0.1),
        createDelayedFinding("0x", senders[1], receivers[3], "ETH", 0.1),
        createDelayedFinding("0x", senders[2], receivers[3], createAddress("0x99"), 0.1),
        createDelayedFinding("0x", senders[3], receivers[3], "ETH", 0.1),
      ]);
    });
  });
});
