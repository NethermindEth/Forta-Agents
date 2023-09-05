import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { Initialize, HandleBlock, HandleAlert } from "forta-agent";
import { when, resetAllWhenMocks } from "jest-when";
import { BigNumber, providers } from "ethers";
import { MockErc721Transfer, MockExploitInfo, MockTxnReceipt, MockTxnResponse } from "./mocks/mock.types";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { createTestingFraudNftOrderFinding } from "./mocks/mock.findings";
import { TestAlertEvent } from "./mocks/mock.alert";
import DataFetcher from "./fetcher";
import {
  createMockScammerAddressBatch,
  createMockTxnReceipt,
  createMockTxnReceiptBatch,
  createMockTxnResponse,
  createMockTxnResponseBatch,
  createMockErc721Transfer,
  createMockExploitBatch,
  createMockAlertEvent,
} from "./mocks/mock.utils";

const ONE_DAY = 1;
const NINETY_DAYS = 90;
const FRAUD_NFT_ORDER_ALERT_ID = "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER";

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();

    const mockDataFetcher = {
      getTransactionReceipt: jest.fn(),
      getTransaction: jest.fn(),
      getNftCollectionFloorPrice: jest.fn(),
      getScammerErc721Transfers: jest.fn(),
    };

    async function mockDataFetcherCreator(provider: providers.Provider): Promise<DataFetcher> {
      return mockDataFetcher as any;
    }

    async function mockDbLoader(key: string): Promise<any> {
      return {};
    }

    const mockChainId = 1;
    const mockAlertBlockNumber = 18053920;

    const mockBlock = new TestBlockEvent();

    const mockNftMarketPlaceAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
    const mockNftFloorPrice = 1000; // in USD

    let initialize: Initialize;
    let handleAlert: HandleAlert;
    let handleBlock: HandleBlock;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~ mock exploit info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const [
      mockScammerAddress,
      mockScammerAddressTwo,
      mockScammerAddressThree,
      mockScammerAddressFour,
      mockScammerAddressFive,
      mockScammerAddressSix,
      mockScammerAddressSeven,
      mockScammerAddressEight,
      mockScammerAddressNine,
    ]: string[] = createMockScammerAddressBatch(9);

    const mockExploitBatchOfSix: MockExploitInfo[] = createMockExploitBatch(6);
    const [
      mockExploit,
      mockExploitTwo,
      mockExploitThree,
      mockExploitFour,
      mockExploitFive,
      mockExploitSix,
    ]: MockExploitInfo[] = mockExploitBatchOfSix;

    const [
      mockTxnReceipt,
      mockTxnReceiptTwo,
      mockTxnReceiptThree,
      mockTxnReceiptFour,
      mockTxnReceiptFive,
      mockTxnReceiptSix,
    ]: MockTxnReceipt[] = createMockTxnReceiptBatch(mockExploitBatchOfSix);
    const [
      mockTxnResponse,
      mockTxnResponseTwo,
      mockTxnResponseThree,
      mockTxnResponseFour,
      mockTxnResponseFive,
      mockTxnResponseSix,
    ]: MockTxnResponse[] = createMockTxnResponseBatch(mockNftMarketPlaceAddress, mockExploitBatchOfSix);
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    beforeEach(async () => {
      resetAllWhenMocks();
      mockProvider.setNetwork(mockChainId);

      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploit.exploitTxnHash)
        .mockResolvedValue(mockTxnReceipt);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitTwo.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptTwo);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitThree.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptThree);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitFour.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptFour);
      // Note: Fifth custom for the 'multiple alerts; multiple instances' test
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitSix.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptSix);

      when(mockDataFetcher.getTransaction).calledWith(mockExploit.exploitTxnHash).mockResolvedValue(mockTxnResponse);
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitTwo.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitThree.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseThree);
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitFour.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseFour);
      // Note: Fifth custom for the 'multiple alerts; multiple instances' test
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitSix.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseSix);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploit.stolenTokenAddress, mockExploit.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitTwo.stolenTokenAddress, mockExploitTwo.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitThree.stolenTokenAddress, mockExploitThree.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitFour.stolenTokenAddress, mockExploitFour.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      // Note: Fifth custom for the 'multiple alerts; multiple instances' test
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSix.stolenTokenAddress, mockExploitSix.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

      initialize = provideInitialize(mockProvider as any, mockDataFetcherCreator, mockDbLoader);
      await initialize();

      handleAlert = provideHandleAlert();
      handleBlock = provideHandleBlock();
    });

    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploit)];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddress, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddress
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploit,
          mockScammerAddress,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);
    });

    it("doesn't create an alert when Scam Detector emits a non-SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {
      const mockAlert: TestAlertEvent = createMockAlertEvent(
        "NON-FRAUDULENT_ORDER_ALERT_ID",
        mockAlertBlockNumber,
        mockScammerAddress
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("creates an alert for the first instance of a scammer appearing in scam detector alerts, then creates alerts for subsequent activity in block handler", async () => {
      //Clear state for mockScammerAddress
      when(mockDataFetcher.getScammerErc721Transfers).calledWith(mockScammerAddress, 1).mockResolvedValue([]);

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploit)];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressTwo
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploit,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);

      const mockBlockHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitTwo),
        createMockErc721Transfer(mockExploitThree),
      ];

      const mockBlockNumber = mockAlertBlockNumber + 3680; // Block number divisible by eth blocks per day

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, 1)
        .mockResolvedValue(mockBlockHandlerErc721Transfers);

      mockBlock.setNumber(mockBlockNumber);

      findings = await handleBlock(mockBlock);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitTwo,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          ONE_DAY
        ),
        createTestingFraudNftOrderFinding(
          mockExploitThree,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          ONE_DAY
        ),
      ]);
    });

    it("does not create an alert when there is a legitimate sale/purchase of an NFT", async () => {
      const mockExploitHighTxnValue: MockExploitInfo = {
        exploitTxnHash: mockExploit.exploitTxnHash,
        fromAddress: mockExploit.fromAddress,
        victimAddress: mockExploit.victimAddress,
        stolenTokenAddress: mockExploit.stolenTokenAddress,
        stolenTokenName: mockExploit.stolenTokenName,
        stolenTokenSymbol: mockExploit.stolenTokenSymbol,
        stolenTokenId: mockExploit.stolenTokenId,
        txnValue: BigNumber.from(40000), // High Txn Value
        blockNumber: mockExploit.blockNumber,
      };

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploitHighTxnValue)];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddress, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnReceipt: MockTxnReceipt = createMockTxnReceipt(mockExploitHighTxnValue);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnReceipt);

      const mockTxnResponse: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitHighTxnValue
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnResponse);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddress
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("creates multiple alerts for the same victim if they were exploited more than once by the same scammer", async () => {
      const mockExploitTwoSameVictim: MockExploitInfo = {
        exploitTxnHash: mockExploitTwo.exploitTxnHash,
        fromAddress: mockExploitTwo.fromAddress,
        victimAddress: mockExploit.victimAddress, // Same victim as mockExploit
        stolenTokenAddress: mockExploitTwo.stolenTokenAddress,
        stolenTokenName: mockExploitTwo.stolenTokenName,
        stolenTokenSymbol: mockExploitTwo.stolenTokenSymbol,
        stolenTokenId: mockExploitTwo.stolenTokenId,
        txnValue: mockExploitTwo.txnValue,
        blockNumber: mockExploitTwo.blockNumber,
      };

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploit),
        createMockErc721Transfer(mockExploitTwoSameVictim),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressThree, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnReceiptTwo: MockTxnReceipt = createMockTxnReceipt(mockExploitTwoSameVictim);

      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitTwoSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptTwo);

      const mockTxnResponseTwo: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitTwoSameVictim
      );

      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitTwoSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitTwoSameVictim.stolenTokenAddress, mockExploitTwoSameVictim.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressThree
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploit,
          mockScammerAddressThree,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
        createTestingFraudNftOrderFinding(
          mockExploitTwoSameVictim,
          mockScammerAddressThree, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);
    });

    it("creates multiple alerts for the same victim if they were exploited by more than one scammer", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploit)];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressFour, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      let mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressFour
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploit,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);

      const mockExploitTwoSameVictim: MockExploitInfo = {
        exploitTxnHash: mockExploitTwo.exploitTxnHash,
        fromAddress: mockExploitTwo.fromAddress,
        victimAddress: mockExploit.victimAddress, // Same victim as mockExploit
        stolenTokenAddress: mockExploitTwo.stolenTokenAddress,
        stolenTokenName: mockExploitTwo.stolenTokenName,
        stolenTokenSymbol: mockExploitTwo.stolenTokenSymbol,
        stolenTokenId: mockExploitTwo.stolenTokenId,
        txnValue: mockExploitTwo.txnValue,
        blockNumber: mockExploitTwo.blockNumber,
      };

      const mockAlertHandlerErc721TransfersTwo: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitTwoSameVictim),
      ];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressFive, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721TransfersTwo);

      const mockTxnReceiptTwo: MockTxnReceipt = createMockTxnReceipt(mockExploitTwoSameVictim);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitTwoSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptTwo);

      const mockTxnResponseTwo: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitTwoSameVictim
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitTwoSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitTwoSameVictim.stolenTokenAddress, mockExploitTwoSameVictim.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

      mockAlert = createMockAlertEvent(FRAUD_NFT_ORDER_ALERT_ID, mockAlertBlockNumber, mockScammerAddressFive);

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitTwoSameVictim,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);
    });

    it("creates multiple alerts for multiple victims as well as multiple scammers", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploit),
        createMockErc721Transfer(mockExploitTwo),
      ];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressSix, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      let mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressSix
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploit,
          mockScammerAddressSix,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
        createTestingFraudNftOrderFinding(
          mockExploitTwo,
          mockScammerAddressSix, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);

      const mockAlertHandlerErc721TransfersTwo: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitThree),
        createMockErc721Transfer(mockExploitFour),
      ];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressSeven, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721TransfersTwo);

      mockAlert = createMockAlertEvent(FRAUD_NFT_ORDER_ALERT_ID, mockAlertBlockNumber, mockScammerAddressSeven);

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitThree,
          mockScammerAddressSeven,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
        createTestingFraudNftOrderFinding(
          mockExploitFour,
          mockScammerAddressSeven, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);
    });

    it("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are sales above the threshold within the same payload", async () => {
      const mockExploitTwoHighTxnValue: MockExploitInfo = {
        exploitTxnHash: mockExploitTwo.exploitTxnHash,
        fromAddress: mockExploitTwo.fromAddress,
        victimAddress: mockExploitTwo.victimAddress,
        stolenTokenAddress: mockExploitTwo.stolenTokenAddress,
        stolenTokenName: mockExploitTwo.stolenTokenName,
        stolenTokenSymbol: mockExploitTwo.stolenTokenSymbol,
        stolenTokenId: mockExploitTwo.stolenTokenId,
        txnValue: BigNumber.from(40000), // High Txn Value
        blockNumber: mockExploitTwo.blockNumber,
      };

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploit),
        createMockErc721Transfer(mockExploitTwoHighTxnValue),
        createMockErc721Transfer(mockExploitThree),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressEight, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnResponseTwo: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitTwoHighTxnValue
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitTwoHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);

      let mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressEight
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploit,
          mockScammerAddressEight,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
        createTestingFraudNftOrderFinding(
          mockExploitThree,
          mockScammerAddressEight, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);

      const mockExploitFiveHighTxnValue: MockExploitInfo = {
        exploitTxnHash: mockExploitFive.exploitTxnHash,
        fromAddress: mockExploitFive.fromAddress,
        victimAddress: mockExploitFive.victimAddress,
        stolenTokenAddress: mockExploitFive.stolenTokenAddress,
        stolenTokenName: mockExploitFive.stolenTokenName,
        stolenTokenSymbol: mockExploitFive.stolenTokenSymbol,
        stolenTokenId: mockExploitFive.stolenTokenId,
        txnValue: BigNumber.from(50000), // High Txn Value
        blockNumber: mockExploitFive.blockNumber,
      };

      const mockAlertHandlerErc721TransfersTwo: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitFour),
        createMockErc721Transfer(mockExploitFiveHighTxnValue),
        createMockErc721Transfer(mockExploitSix),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressNine, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721TransfersTwo);

      const mockTxnReceiptFive: MockTxnReceipt = createMockTxnReceipt(mockExploitFiveHighTxnValue);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitFiveHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptFive);

      const mockTxnResponseFour: MockTxnResponse = createMockTxnResponse(mockNftMarketPlaceAddress, mockExploitFour);
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitFour.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseFour);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitFour.stolenTokenAddress, mockExploitFour.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

      const mockTxnResponseFive: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitFiveHighTxnValue
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitFiveHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseFive);

      mockAlert = createMockAlertEvent(FRAUD_NFT_ORDER_ALERT_ID, mockAlertBlockNumber, mockScammerAddressNine);

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitFour,
          mockScammerAddressNine,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
        createTestingFraudNftOrderFinding(
          mockExploitSix,
          mockScammerAddressNine, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS
        ),
      ]);
    });

    it("creates multiple alerts for fraudulent NFT orders that ocurred in the same transaction", async () => {});
  });
});