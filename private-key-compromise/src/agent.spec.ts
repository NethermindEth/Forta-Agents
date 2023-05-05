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

import { TestTransactionEvent, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { provideInitialize, provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import fetch, { Response } from "node-fetch";
import { AgentConfig, NetworkData, ERC20_TRANSFER_EVENT, BALANCEOF_ABI } from "./utils";
import { PersistenceHelper } from "./persistence.helper";
import BalanceFetcher from "./balance.fetcher";

jest.mock("node-fetch");
const BALANCE_IFACE = new Interface(BALANCEOF_ABI);

const mockChainId = 1;
const mockDbUrl = "databaseurl.com/";
const mockJwt = "MOCK_JWT";
const mockpKCompValueKey = "mock-pk-comp-value-bot-key";
const mockpKCompValueTxns = {
  "0x0000000000000000000000000000000000000020": [createAddress("0x21")],
};

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
const senders = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3"), createAddress("0x4")];

const receivers = [createAddress("0x11"), createAddress("0x12"), createAddress("0x13"), createAddress("0x14")];

const createFinding = (txHash: string, from: string[], to: string, anomalyScore: number): Finding => {
  return Finding.fromObject({
    name: "Possible private key compromise",
    description: `${from.toString()} transferred funds to ${to}`,
    alertId: "PKC-1",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victims: from.toString(),
      anomalyScore: anomalyScore.toString(),
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
        entity: from.toString(),
        entityType: EntityType.Address,
        label: "Victim",
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
    ],
  });
};

describe("Detect Private Key Compromise", () => {
  let mockPersistenceHelper: PersistenceHelper;
  let mockProvider: MockEthersProviderExtension;
  let mockFetch = jest.mocked(fetch, true);
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;
  let mockFetchResponse: Response;
  let mockBalanceFetcher: BalanceFetcher;

  const mockContractFetcher = {
    getContractInfo: jest.fn(),
  };

  const mockDataFetcher = {
    isEoa: jest.fn(),
  };

  beforeAll(() => {
    mockProvider = new MockEthersProviderExtension();
    mockPersistenceHelper = new PersistenceHelper(mockDbUrl);
    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
  });

  beforeEach(async () => {
    mockProvider.setNetwork(mockChainId);
    initialize = provideInitialize(networkManager, mockProvider as any, mockPersistenceHelper, mockpKCompValueKey);
    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(Promise.resolve(mockpKCompValueTxns)),
    } as any as Response;

    mockCalculateAlertRate.mockResolvedValueOnce("0.1");
    mockFetchJwt.mockResolvedValue(mockJwt);
    mockFetch.mockResolvedValue(mockFetchResponse);
    mockBalanceFetcher = new BalanceFetcher(mockProvider as any);

    await initialize();

    handleTransaction = provideHandleTransaction(
      mockProvider as any,
      networkManager,
      mockBalanceFetcher,
      mockContractFetcher as any,
      mockDataFetcher as any,
      mockPersistenceHelper,
      mockpKCompValueKey
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
    it("returns empty findings if there is no native token transfers", async () => {
      const txEvent = new TestTransactionEvent();

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there is 3 native transfers and 0 token transfers to an attacker address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[0]);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[0]);
      const txEvent3 = new TestTransactionEvent().setFrom(senders[2]).setTo(receivers[0]);

      txEvent.setValue("1");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
      txEvent2.setValue("2");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);
      txEvent3.setValue("3");
      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are 2 native transfers and 1 token transfer to an attacker address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[0]);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[0]);
      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[2],
          receivers[0],
          ethers.BigNumber.from("1000000"),
        ]);

      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");

      txEvent.setValue("1");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
      txEvent2.setValue("2");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there are 1 native transfers and 2 token transfer to an attacker address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[0]);

      const txEvent2 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[1],
          receivers[0],
          ethers.BigNumber.from("1000000"),
        ]);

      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[2],
          receivers[0],
          ethers.BigNumber.from("1000000"),
        ]);

      setTokenBalance(createAddress("0x99"), 1, senders[1], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");

      txEvent.setValue("1");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
    });

    it("returns findings if there are more than 3 native transfers to a single address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[0]);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[0]);
      const txEvent3 = new TestTransactionEvent().setFrom(senders[2]).setTo(receivers[0]);
      const txEvent4 = new TestTransactionEvent().setFrom(senders[3]).setTo(receivers[0]);

      when(mockDataFetcher.isEoa).calledWith(receivers[0]).mockReturnValue(true);

      txEvent.setValue("1");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
      txEvent2.setValue("2");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);
      txEvent3.setValue("3");
      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
      txEvent4.setValue("4");
      findings = await handleTransaction(txEvent4);
      expect(findings).toStrictEqual([
        createFinding("0x", [senders[0], senders[1], senders[2], senders[3]], receivers[0], 0.1),
      ]);
    });

    it("returns findings if there are more than 3 token transfers", async () => {
      let findings;
      const txEvent = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[0],
          receivers[1],
          ethers.BigNumber.from("1000000"),
        ]);

      const txEvent2 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[1],
          receivers[1],
          ethers.BigNumber.from("1000000"),
        ]);

      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[2],
          receivers[1],
          ethers.BigNumber.from("1000000"),
        ]);

      const txEvent4 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[3],
          receivers[1],
          ethers.BigNumber.from("1000000"),
        ]);

      setTokenBalance(createAddress("0x99"), 1, senders[0], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[1], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");
      setTokenBalance(createAddress("0x99"), 1, senders[3], "0");

      when(mockDataFetcher.isEoa).calledWith(receivers[1]).mockReturnValue(true);

      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent4);
      expect(findings).toStrictEqual([
        createFinding("0x", [senders[0], senders[1], senders[2], senders[3]], receivers[1], 0.1),
      ]);
    });

    it("returns empty findings if there are 3 native transfers and 1 token transfer to an attacker address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent().setFrom(senders[0]).setTo(receivers[2]);
      const txEvent2 = new TestTransactionEvent().setFrom(senders[1]).setTo(receivers[2]);
      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          senders[2],
          receivers[2],
          ethers.BigNumber.from("1000000"),
        ]);
      const txEvent4 = new TestTransactionEvent().setFrom(senders[3]).setTo(receivers[2]);

      setTokenBalance(createAddress("0x99"), 1, senders[2], "0");
      when(mockDataFetcher.isEoa).calledWith(receivers[2]).mockReturnValue(true);

      txEvent.setValue("1");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);

      txEvent2.setValue("2");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);

      txEvent4.setValue("4");
      findings = await handleTransaction(txEvent4);
      expect(findings).toStrictEqual([
        createFinding("0x", [senders[0], senders[1], senders[2], senders[3]], receivers[2], 0.1),
      ]);
    });
  });

  // describe("Block handler test suite", () => {
  //   it("should not persist values because block is not evenly divisible by 150", async () => {
  //     const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(305);
  //     await handleBlock(mockBlockEvent);
  //     expect(mockFetchJwt).toHaveBeenCalledTimes(2);
  //     expect(mockFetchResponse.json).toHaveBeenCalledTimes(2);
  //   });
  //   it("should persist the value in a block evenly divisible by 150", async () => {
  //     const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);
  //     const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  //     await handleBlock(mockBlockEvent);
  //     expect(spy).toHaveBeenCalledWith("successfully persisted to database");
  //     expect(mockFetchJwt).toHaveBeenCalledTimes(3); // Two during initialization, two in block handler
  //     expect(mockFetch).toHaveBeenCalledTimes(3); // Two during initialization, two in block handler

  //     expect(mockFetch.mock.calls[1][0]).toEqual(
  //       `${mockDbUrl}${mockpKCompValueKey.concat("-", mockChainId.toString())}`
  //     );
  //     expect(mockFetch.mock.calls[2][1]!.method).toEqual("POST");
  //     expect(mockFetch.mock.calls[2][1]!.headers).toEqual({
  //       Authorization: `Bearer ${mockJwt}`,
  //     });
  //     expect(mockFetch.mock.calls[2][1]!.body).toEqual(JSON.stringify(mockpKCompValueTxns));
  //   });
  // });
});
