import { Finding, HandleTransaction } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { HUBPOOL_EVENTS, TOKEN_IFACE } from "./utils";
import TokenBalanceHelper from "./token.balance.helper";
import { createFinding } from "./findings.helper";
import { NetworkData } from "./network";
import LRU from "lru-cache";

const INCORRECT_EVENT = "event incorrectEvent(address to, address from)";

const mockHubPoolAddress: string = createAddress("0x123abc");
const mockTokenAddress: string = createAddress("0x01aa");
const mockTokenAddress2: string = createAddress("0x022aa");
const mockLPAddress: string = createAddress("0x2bb");

const MOCK_ADDRESSES = [createAddress("0x1a"), createAddress("0x2b")];
const MOCK_AMOUNT = [100, 200, 900, 1000, 1100, 990];
const MOCK_BLOCK = [1, 2];
const MOCK_TIMESTAMP = [1, 2, 86410];

const MOCK_NETWORK_DATA: Record<number, NetworkData> = {
  1: {
    hubPoolAddress: mockHubPoolAddress,
  },
};

type mockBlockType = {
  hash: string;
  parentHash: string;
  number: number;
  timestamp: number;
  nonce: string;
  difficulty: number;
  gasLimit: number;
  gasUsed: number;
  miner: string;
  extraData: string;
  transactions: [];
  baseFeePerGas: number;
  _difficulty: number;
};

describe("UMA Liquidity Agent", () => {
  let findings: Finding[];

  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = new NetworkManager(MOCK_NETWORK_DATA, 1);
  const mockLRUCache = new LRU<string, any>({ max: 10000 });
  const mockBalanceFetcher: TokenBalanceHelper = new TokenBalanceHelper(mockProvider as any, mockNetworkManager);

  const createBalanceOfCall = (
    mockTokenAdd: string,
    mockHubPoolAddress: string,
    blockNumber: number,
    tokenAmount: number,
    timestamp: number
  ) => {
    mockProvider.addCallTo(mockTokenAdd, blockNumber, TOKEN_IFACE, "balanceOf", {
      inputs: [mockHubPoolAddress],
      outputs: [tokenAmount],
    });

    const mockBlock: mockBlockType = {
      _difficulty: 1,
      baseFeePerGas: 1,
      difficulty: 1,
      extraData: "",
      gasLimit: 1,
      gasUsed: 1,
      hash: "123",
      miner: "0x123455555",
      nonce: "0x54321",
      number: blockNumber,
      parentHash: "0x1111111",
      transactions: [],
      timestamp: timestamp,
    };

    mockProvider.addBlock(blockNumber, mockBlock);
  };

  describe("handleTransaction", () => {
    let handleTransaction: HandleTransaction;

    beforeEach(() => {
      mockLRUCache.set(mockTokenAddress, undefined);
      mockLRUCache.set(mockTokenAddress2, undefined);
      handleTransaction = provideHandleTransaction(mockBalanceFetcher, mockNetworkManager, mockLRUCache);
      mockProvider.clear();
    });

    it("returns empty findings if there are no UMA findings", async () => {
      const txEvent = new TestTransactionEvent();
      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if other events are emitted", async () => {
      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .addEventLog(INCORRECT_EVENT, mockHubPoolAddress, [MOCK_ADDRESSES[0], MOCK_ADDRESSES[1]]);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty finding if event isnt emitted from the hubpool address", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[3], MOCK_TIMESTAMP[1]);

      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .setBlock(MOCK_BLOCK[0])
        .setTimestamp(MOCK_TIMESTAMP[1])
        .setTo(MOCK_ADDRESSES[1])
        .addEventLog(HUBPOOL_EVENTS, MOCK_ADDRESSES[1], [
          mockTokenAddress,
          MOCK_AMOUNT[0],
          MOCK_AMOUNT[0],
          mockLPAddress,
        ]);

      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty finding when events are emitted but value isnt more than 10%", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[3], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[5], MOCK_TIMESTAMP[1]);

      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .setBlock(MOCK_BLOCK[1])
        .setTimestamp(MOCK_TIMESTAMP[1])
        .setTo(mockHubPoolAddress)
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress,
          MOCK_AMOUNT[0],
          MOCK_AMOUNT[0],
          mockLPAddress,
        ]);

      findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a finding when events are emitted and value is more than 10%", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);

      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .setBlock(MOCK_BLOCK[1])
        .setTimestamp(MOCK_TIMESTAMP[1])
        .setTo(mockHubPoolAddress)
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress,
          MOCK_AMOUNT[1],
          MOCK_AMOUNT[1],
          mockLPAddress,
        ]);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([createFinding(mockTokenAddress, MOCK_AMOUNT[4], MOCK_AMOUNT[2])]);
    });

    it("returns no finding because period was more than 24 hours", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[2]);

      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .setBlock(MOCK_BLOCK[1])
        .setTimestamp(MOCK_TIMESTAMP[2])
        .setTo(mockHubPoolAddress)
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress,
          MOCK_AMOUNT[1],
          MOCK_AMOUNT[1],
          mockLPAddress,
        ]);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns multitple findings from multiple event emissions of different tokens", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);

      createBalanceOfCall(mockTokenAddress2, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress2, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);

      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .setBlock(MOCK_BLOCK[1])
        .setTimestamp(MOCK_TIMESTAMP[1])
        .setTo(mockHubPoolAddress)
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress,
          MOCK_AMOUNT[1],
          MOCK_AMOUNT[1],
          mockLPAddress,
        ])
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress2,
          MOCK_AMOUNT[1],
          MOCK_AMOUNT[1],
          mockLPAddress,
        ]);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(mockTokenAddress, MOCK_AMOUNT[4], MOCK_AMOUNT[2]),
        createFinding(mockTokenAddress2, MOCK_AMOUNT[4], MOCK_AMOUNT[2]),
      ]);
    });

    it("returns multitple findings from multiple event emissions of the same tokens", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);

      const txEvent = new TestTransactionEvent()
        .setFrom(MOCK_ADDRESSES[0])
        .setBlock(MOCK_BLOCK[1])
        .setTimestamp(MOCK_TIMESTAMP[1])
        .setTo(mockHubPoolAddress)
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress,
          MOCK_AMOUNT[1],
          MOCK_AMOUNT[1],
          mockLPAddress,
        ])
        .addEventLog(HUBPOOL_EVENTS, mockHubPoolAddress, [
          mockTokenAddress,
          MOCK_AMOUNT[2],
          MOCK_AMOUNT[2],
          mockLPAddress,
        ]);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(mockTokenAddress, MOCK_AMOUNT[4], MOCK_AMOUNT[2]),
        createFinding(mockTokenAddress, MOCK_AMOUNT[4], MOCK_AMOUNT[2]),
      ]);
    });
  });
});
