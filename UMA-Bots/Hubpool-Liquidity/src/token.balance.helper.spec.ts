import { ethers, HandleTransaction } from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { TOKEN_IFACE } from "./utils";
import TokenBalanceHelper from "./token.balance.helper";
import { NetworkData } from "./network";
import LRU from "lru-cache";


const mockHubPoolAddress: string = createAddress("0x123abc");
const mockTokenAddress: string = createAddress("0x01aa");

const MOCK_AMOUNT = [100, 200, 900, 1000, 1100, 990];
const MOCK_BLOCK = [1, 2];
const MOCK_TIMESTAMP = [1, 2, 86410];

const MOCK_NETWORK_DATA: Record<number, NetworkData> = {
  1: {
    hubPoolAddress: mockHubPoolAddress
  },
};

type mockBlockType = {
  hash: string,
  parentHash: string,
  number: number,
  timestamp: number,
  nonce: string,
  difficulty: number,
  gasLimit: number,
  gasUsed: number,
  miner: string,
  extraData: string,
  transactions: [],
  baseFeePerGas: number,
  _difficulty: number
}


describe("UMA Liquidity Agent", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = new NetworkManager(MOCK_NETWORK_DATA, 1)
  const mockLRUCache = new LRU<string, any>({ max: 10000 });
  const mockBalanceFetcher: TokenBalanceHelper = new TokenBalanceHelper(mockProvider as any, mockNetworkManager);

  const createBalanceOfCall = (mockTokenAdd: string, mockHubPoolAddress: string, blockNumber: number, tokenAmount: number, timestamp: number) => {
    mockProvider.addCallTo(mockTokenAdd, blockNumber, TOKEN_IFACE, "balanceOf", {
      inputs: [mockHubPoolAddress],
      outputs: [tokenAmount],
    });

    const mockBlock: mockBlockType = {
      _difficulty: 1,
      baseFeePerGas: 1,
      difficulty: 1,
      extraData: '',
      gasLimit: 1,
      gasUsed: 1,
      hash: '123',
      miner: '0x123455555',
      nonce: '0x54321',
      number: blockNumber,
      parentHash: '0x1111111',
      transactions: [],
      timestamp: timestamp
    }

    mockProvider.addBlock(blockNumber, mockBlock)
  };

  describe("handleTransaction", () => {
    let handleTransaction: HandleTransaction;

    beforeEach(() => {
      mockLRUCache.set(mockTokenAddress, undefined);
      handleTransaction  = provideHandleTransaction(mockBalanceFetcher, mockNetworkManager, mockLRUCache);
      mockProvider.clear();
    });

    it("should return the right balance", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);
      const [oldBal, newBal] = await mockBalanceFetcher.getBalance(mockTokenAddress, MOCK_BLOCK[1])

      expect([oldBal.toString(), newBal.toString()]).toStrictEqual(["1100", "900"]);
    });

    it("should return the right cycle", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);
      const cycle = await mockBalanceFetcher.getCurrentCycle(mockTokenAddress, MOCK_BLOCK[1], mockLRUCache)

      const mockResult = {
        amountRemoved: 0,
        cycleTimestamp: MOCK_TIMESTAMP[0],
        initialAmount: ethers.BigNumber.from(1100),
        newAmount: ethers.BigNumber.from(1100),
        percentChanged: 0
      }

      expect([cycle]).toStrictEqual([mockResult]);
    });

    it("should start a new cycle", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);
      await mockBalanceFetcher.startNewCycle(mockTokenAddress, MOCK_BLOCK[1], MOCK_TIMESTAMP[1], mockLRUCache)

      const cycle = mockLRUCache.get(mockTokenAddress)

      const mockResult = {
        amountRemoved: 0,
        cycleTimestamp: MOCK_TIMESTAMP[1],
        initialAmount: ethers.BigNumber.from(900),
        newAmount: ethers.BigNumber.from(900),
        percentChanged: 0
      }

      expect([cycle]).toStrictEqual([mockResult]);
    });

    it("should start a new cycle", async () => {
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[0], MOCK_AMOUNT[4], MOCK_TIMESTAMP[0]);
      createBalanceOfCall(mockTokenAddress, mockHubPoolAddress, MOCK_BLOCK[1], MOCK_AMOUNT[2], MOCK_TIMESTAMP[1]);
      await mockBalanceFetcher.getCurrentCycle(mockTokenAddress, MOCK_BLOCK[1], mockLRUCache)
      const cycle = await mockBalanceFetcher.calculateChange(mockTokenAddress, MOCK_BLOCK[1], mockLRUCache)

      const mockResult = {
        amountRemoved: 200,
        cycleTimestamp: MOCK_TIMESTAMP[0],
        initialAmount: ethers.BigNumber.from(1100),
        newAmount: ethers.BigNumber.from(900),
        percentChanged: 0.18181818181818182
      }

      expect([cycle]).toStrictEqual([mockResult]);
    });
  });
});
