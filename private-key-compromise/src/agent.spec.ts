// returns empty findings if there is no transfer events
// returns empty findings if there is 3 native transfers and 0 token transfers to an attacker address
// returns empty findings if there is 3 token transfers and 0 native transfers to an attacker address
// returns empty findings if there is 2 native transfers and 1 token transfer to an attacker address
// returns empty findings if there is 2 token transfers and 1 native transfers to an attacker address
// returns findings if there is more than 3 native transfers
// returns findings if there is more than 3 erc20 token transfers
// returns findings if there is 3 native transfers and 1 token transfers to an attacker address
// returns findings if there is 2 native transfers and 2 token transfers to an attacker address

import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  HandleBlock,
  Network,
  Label,
  EntityType,
  Initialize,
  ethers,
} from "forta-agent";
import { Interface } from "@ethersproject/abi";

import { TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { provideInitialize, provideHandleTransaction, provideHandleBlock } from "./agent";
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
const mockpKCompValueTxns = {};

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

  public setBalance(
    addr: string,
    block: number,
    balance: number
  ): MockEthersProviderExtension {
    when(this.getBalance).calledWith(addr, block).mockReturnValue(balance);
    return this;
  }
}

describe("Detect Very High Txn Value", () => {
  let mockPersistenceHelper: PersistenceHelper;
  let mockProvider: MockEthersProviderExtension;
  let mockFetch = jest.mocked(fetch, true);
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let networkManager: NetworkManager<NetworkData>;
  let mockFetchResponse: Response;
  let mockBalanceFetcher: BalanceFetcher;

  beforeAll(() => {
    mockProvider = new MockEthersProviderExtension();
    mockPersistenceHelper = new PersistenceHelper(mockDbUrl);
    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
  });

  beforeEach(async () => {
    mockProvider.setNetwork(mockChainId);
    initialize = provideInitialize(
      networkManager,
      mockProvider as any,
      mockPersistenceHelper,
      mockpKCompValueKey
    );
    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchResponse = {
      ok: true,
      json: jest
        .fn()
        .mockResolvedValueOnce(Promise.resolve(JSON.stringify(mockpKCompValueTxns))),
    } as any as Response;

    // mockFetchJwt.mockResolvedValue(mockJwt);
    mockFetch.mockResolvedValue(mockFetchResponse);
    mockBalanceFetcher = new BalanceFetcher(mockProvider as any);

    await initialize();

    handleTransaction = provideHandleTransaction(
      mockProvider as any,
      networkManager,
      mockBalanceFetcher
    );
    handleBlock = provideHandleBlock(mockPersistenceHelper, mockpKCompValueKey);
    delete process.env.LOCAL_NODE;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.only("Transaction handler test suite", () => {
    it("returns empty findings if there is no native token transfers", async () => {
      const txEvent = new TestTransactionEvent();

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if there is 3 native transfers and 0 token transfers to an attacker address", async () => {
      let findings;
      const txEvent = new TestTransactionEvent()
        .setFrom(createAddress("0x1"))
        .setTo(createAddress("0x13"));
      const txEvent2 = new TestTransactionEvent()
        .setFrom(createAddress("0x2"))
        .setTo(createAddress("0x13"));
      const txEvent3 = new TestTransactionEvent()
        .setFrom(createAddress("0x3"))
        .setTo(createAddress("0x13"));

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
      const txEvent = new TestTransactionEvent()
        .setFrom(createAddress("0x1"))
        .setTo(createAddress("0x13"));
      const txEvent2 = new TestTransactionEvent()
        .setFrom(createAddress("0x2"))
        .setTo(createAddress("0x13"));
      const txEvent3 = new TestTransactionEvent()
        .setBlock(1)
        .addEventLog(ERC20_TRANSFER_EVENT, createAddress("0x99"), [
          createAddress("0x3"),
          createAddress("0x2"),
          ethers.BigNumber.from("1000000"),
        ]);

      mockProvider.addCallTo(createAddress("0x99"), 1, BALANCE_IFACE, "balanceOf", {
        inputs: [createAddress("0x3")],
        outputs: [ethers.BigNumber.from("0")],
      });

      txEvent.setValue("1");
      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
      txEvent2.setValue("2");
      findings = await handleTransaction(txEvent2);
      expect(findings).toStrictEqual([]);

      findings = await handleTransaction(txEvent3);
      expect(findings).toStrictEqual([]);
    });

    // describe("Block handler test suite", () => {
    //   it("should not persist values because block is not evenly divisible by 240", async () => {
    //     const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

    //     await handleBlock(mockBlockEvent);

    //     // Only the three times for the initialize
    //     expect(mockFetchJwt).toHaveBeenCalledTimes(2);
    //     expect(mockFetchResponse.json).toHaveBeenCalledTimes(2);
    //   });

    //   it("should persist the value in a block evenly divisible by 240", async () => {
    //     const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

    //     const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    //     await handleBlock(mockBlockEvent);

    //     expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockAnomalousValueTxns} to database`);
    //     expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockAllTxnsWithValue} to database`);
    //     expect(mockFetchJwt).toHaveBeenCalledTimes(4); // Two during initialization, two in block handler
    //     expect(mockFetch).toHaveBeenCalledTimes(4); // Two during initialization, two in block handler

    //     expect(mockFetch.mock.calls[2][0]).toEqual(
    //       `${mockDbUrl}${mockAnomalousValueKey.concat("-", mockChainId.toString())}`
    //     );
    //     expect(mockFetch.mock.calls[2][1]!.method).toEqual("POST");
    //     expect(mockFetch.mock.calls[2][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
    //     expect(mockFetch.mock.calls[2][1]!.body).toEqual(JSON.stringify(mockAnomalousValueTxns));

    //     expect(mockFetch.mock.calls[3][0]).toEqual(`${mockDbUrl}${mockAllValueKey.concat("-", mockChainId.toString())}`);
    //     expect(mockFetch.mock.calls[3][1]!.method).toEqual("POST");
    //     expect(mockFetch.mock.calls[3][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
    //     expect(mockFetch.mock.calls[3][1]!.body).toEqual(JSON.stringify(mockAllTxnsWithValue));
    //   });
  });
});
