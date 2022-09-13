import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { HUBPOOL_ADDRESS, HUBPOOL_EVENTS, TOKEN_IFACE } from "./utils";
import TokenBalanceHelper from "./token.balance.helper";
import { Interface } from "ethers/lib/utils";
import { createFinding } from "./findings.helper";
import NetworkData from "./network";

const INCORRECT_EVENT = "event incorrectEvent(address to, address from)";
const INCORRECT_EVENT_IFACE: Interface = new Interface([INCORRECT_EVENT]);

const LIQ_REMOVED_EVENT_IFACE: Interface = new Interface([HUBPOOL_EVENTS[0]]);
const LIQ_ADDED_EVENT_IFACE: Interface = new Interface([HUBPOOL_EVENTS[1]]);

// const mockHubPoolAddress: string = createAddress("0x123abc");
const mockTokenAddress: string = createAddress("0x01a");
const mockLPAddress: string = createAddress("0x2b");

const MOCK_ADDRESSES = [createAddress("0x1a"), createAddress("0x2b")];

describe("UMA Liquidity Agent", () => {
  let txEvent: TransactionEvent;
  let findings: Finding[];

  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkData = {
    hubPoolAddress: createAddress("0xaaabbb111"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const mockBalanceFetcher: TokenBalanceHelper = new TokenBalanceHelper(mockProvider as any, mockNetworkManager);

  const createBalanceOfCall = (mockHubPoolAddress: string, blockNumber: number, tokenAmount: number) => {
    mockProvider.addCallTo(mockTokenAddress, blockNumber, TOKEN_IFACE, "balanceOf", {
      inputs: [mockHubPoolAddress],
      outputs: [tokenAmount],
    });
  };

  describe("handleTransaction", () => {
    const handleTransaction: HandleTransaction = provideHandleTransaction(mockBalanceFetcher, mockNetworkManager);

    beforeEach(() => {
      mockProvider.clear();
    });

    it("returns empty findings if there are no UMA findings", async () => {
      txEvent = new TestTransactionEvent();
      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if other events are emitted", async () => {
      const incorrectEventLog = INCORRECT_EVENT_IFACE.encodeEventLog(INCORRECT_EVENT_IFACE.getEvent("incorrectEvent"), [
        MOCK_ADDRESSES[0],
        MOCK_ADDRESSES[1],
      ]);

      txEvent = new TestTransactionEvent().addAnonymousEventLog(
        mockNetworkManager.hubPoolAddress,
        incorrectEventLog.data,
        ...incorrectEventLog.topics
      );

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if a liquidity added event is emitted", async () => {
      createBalanceOfCall(mockNetworkManager.hubPoolAddress, 998, 0);
      createBalanceOfCall(mockNetworkManager.hubPoolAddress, 999, 123);

      const liquidityAddedEvent = LIQ_ADDED_EVENT_IFACE.encodeEventLog(
        LIQ_ADDED_EVENT_IFACE.getEvent("LiquidityAdded"),
        [mockTokenAddress, 123, 456, mockLPAddress]
      );

      txEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.hubPoolAddress)
        .setFrom(mockLPAddress)
        .setBlock(999)
        .addAnonymousEventLog(
          mockNetworkManager.hubPoolAddress,
          liquidityAddedEvent.data,
          ...liquidityAddedEvent.topics
        );

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([createFinding("LiquidityAdded", mockTokenAddress, 0, 123)]);
    });

    it("returns a finding if a liquidity removed event is emitted", async () => {
      createBalanceOfCall(mockNetworkManager.hubPoolAddress, 1000, 246);
      createBalanceOfCall(mockNetworkManager.hubPoolAddress, 1001, 123);

      const liquidityRemovedEvent = LIQ_REMOVED_EVENT_IFACE.encodeEventLog(
        LIQ_REMOVED_EVENT_IFACE.getEvent("LiquidityRemoved"),
        [mockTokenAddress, 123, 456, mockLPAddress]
      );

      txEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.hubPoolAddress)
        .setFrom(mockLPAddress)
        .setBlock(1001)
        .addAnonymousEventLog(
          mockNetworkManager.hubPoolAddress,
          liquidityRemovedEvent.data,
          ...liquidityRemovedEvent.topics
        );

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([createFinding("LiquidityRemoved", mockTokenAddress, 246, 123)]);
    });

    it("returns an empty finding from the wrong contract", async () => {
      createBalanceOfCall(mockNetworkManager.hubPoolAddress, 1003, 246);
      createBalanceOfCall(mockNetworkManager.hubPoolAddress, 1004, 123);

      const mockWrongAddress: string = createAddress("0x123456789");

      const liquidityRemovedEvent = LIQ_REMOVED_EVENT_IFACE.encodeEventLog(
        LIQ_REMOVED_EVENT_IFACE.getEvent("LiquidityRemoved"),
        [mockTokenAddress, 123, 456, mockLPAddress]
      );

      txEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.hubPoolAddress)
        .setFrom(mockLPAddress)
        .setBlock(1004)
        .addAnonymousEventLog(mockWrongAddress, liquidityRemovedEvent.data, ...liquidityRemovedEvent.topics);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
