import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { Initialize, HandleBlock, HandleAlert } from "forta-agent";
import { when, resetAllWhenMocks } from "jest-when";
import { BigNumber, providers, utils } from "ethers";
import {
  MockErc721Transfer,
  MockExploitInfo,
  MockIcePhishingTransfer,
  MockTxnReceipt,
  MockTxnResponse,
} from "./mocks/mock.types";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { createTestingFraudNftOrderFinding, createTestingIcePhishingFinding } from "./mocks/mock.findings";
import { TestAlertEvent } from "./mocks/mock.alert";
import DataFetcher from "./fetcher";
import {
  createMockTxnReceiptWithErc20TransferLog,
  createMockTxnReceiptWithNftExchangeLogs,
  createMockScammerAddressBatch,
  createMockTxnResponseBatch,
  createMockTxnReceiptBatch,
  createMockErc721Transfer,
  createMockTxnResponse,
  createMockTxnReceipt,
  createMockAlertEvent,
  createMockErc721ExploitBatch,
  createMockErc20ExploitBatch,
  createMockIcePhishingTransfer,
} from "./mocks/mock.utils";
import { createAddress } from "forta-agent-tools";
import {
  BLOCKSEC_ICE_PHISHING_BOT,
  DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS,
  NETHERMIND_ICE_PHISHING_BOT,
  SCAM_DETECTOR_ALERT_IDS,
} from "./constants";

const NINETY_DAYS = 90;
const FRAUD_NFT_ORDER_ALERT_ID = SCAM_DETECTOR_ALERT_IDS[0];
const ICE_PHISHING_ALERT_ID = SCAM_DETECTOR_ALERT_IDS[1];

describe("Victim & Loss Identifier Test Suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockGetAlerts = jest.fn();
  const mockNftFloorPrice = 1000; // in USD
  const mockAlertBlockNumber = 18053920;
  const mockNftMarketPlaceAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
  const mockErc20TokenAddress = createAddress("0x12345");
  const mockChainId = 1;

  const mockDataFetcher = {
    getTransactionReceipt: jest.fn(),
    getTransaction: jest.fn(),
    getNftCollectionFloorPrice: jest.fn().mockResolvedValue(mockNftFloorPrice),
    getScammerErc721Transfers: jest.fn(),
    hasBuyerTransferredTokenToSeller: jest.fn(),
    getScammerIcePhishingTransfers: jest.fn(),
    getValueInUsd: jest.fn().mockResolvedValue(12),
  };

  async function mockDataFetcherCreator(provider: providers.Provider): Promise<DataFetcher> {
    return mockDataFetcher as any;
  }

  async function mockDbLoader(key: string): Promise<any> {
    return {};
  }

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
    mockScammerAddressTen,
    mockScammerAddressEleven,
  ]: string[] = createMockScammerAddressBatch(11);

  const mockErc721ExploitBatch: MockExploitInfo[] = createMockErc721ExploitBatch(20);
  const [
    mockExploit,
    mockExploitTwo,
    mockExploitThree,
    mockExploitFour,
    mockExploitFive,
    mockExploitSix,
    mockExploitSeven,
    mockExploitEight,
    mockExploitNine,
    mockExploitTen,
    mockExploitEleven,
    mockExploitTwelve,
    mockExploitThirteen,
    mockExploitFourteen,
    mockExploitFifteen,
    mockExploitSixteen,
    mockExploitSeventeen,
    mockExploitEighteen,
    mockExploitNineteen,
    mockExploitTwenty,
  ]: MockExploitInfo[] = mockErc721ExploitBatch;

  const mockErc20ExploitBatch: MockExploitInfo[] = createMockErc20ExploitBatch(3);
  const [mockErc20Exploit, mockErc20ExploitTwo, mockErc20ExploitThree]: MockExploitInfo[] = mockErc20ExploitBatch;

  const [
    mockTxnReceipt,
    mockTxnReceiptTwo,
    mockTxnReceiptThree,
    mockTxnReceiptFour,
    mockTxnReceiptFive,
    mockTxnReceiptSix,
    mockTxnReceiptSeven,
    mockTxnReceiptEight,
    mockTxnReceiptNine,
    mockTxnReceiptTen,
    mockTxnReceiptEleven,
    mockTxnReceiptTwelve,
    mockTxnReceiptThirteen,
    mockTxnReceiptFourteen,
    mockTxnReceiptFifteen,
    mockTxnReceiptSixteen,
    mockTxnReceiptSeventeen,
  ]: MockTxnReceipt[] = createMockTxnReceiptBatch(mockErc721ExploitBatch);
  const [
    mockTxnResponse,
    mockTxnResponseTwo,
    mockTxnResponseThree,
    mockTxnResponseFour,
    mockTxnResponseFive,
    mockTxnResponseSix,
    mockTxnResponseSeven,
    mockTxnResponseEight,
    mockTxnResponseNine,
    mockTxnResponseTen,
    mockTxnResponseEleven,
    mockTxnResponseTwelve,
    mockTxnResponseThirteen,
    mockTxnResponseFourteen,
    mockTxnResponseFifteen,
    mockTxnResponseSixteen,
    mockTxnResponseSeventeen,
  ]: MockTxnResponse[] = createMockTxnResponseBatch(mockNftMarketPlaceAddress, mockErc721ExploitBatch);
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
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitFive.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptFive);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitSix.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptSix);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitSeven.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptSeven);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitEight.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptEight);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitNine.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptNine);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitTen.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptTen);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitEleven.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptEleven);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitTwelve.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptTwelve);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitThirteen.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptThirteen);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitFourteen.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptFourteen);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitFifteen.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptFifteen);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitSixteen.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptSixteen);
    when(mockDataFetcher.getTransactionReceipt)
      .calledWith(mockExploitSeventeen.exploitTxnHash)
      .mockResolvedValue(mockTxnReceiptSeventeen);

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
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitFive.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseFive);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitSix.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseSix);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitSeven.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseSeven);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitEight.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseEight);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitNine.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseNine);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitTen.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseTen);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitEleven.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseEleven);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitTwelve.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseTwelve);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitThirteen.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseThirteen);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitFourteen.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseFourteen);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitFifteen.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseFifteen);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitSixteen.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseSixteen);
    when(mockDataFetcher.getTransaction)
      .calledWith(mockExploitSeventeen.exploitTxnHash)
      .mockResolvedValue(mockTxnResponseSeventeen);

    mockDataFetcher.hasBuyerTransferredTokenToSeller.mockResolvedValue(false);

    initialize = provideInitialize(mockProvider as any, mockDataFetcherCreator, mockDbLoader);
    handleAlert = provideHandleAlert(mockGetAlerts);
    handleBlock = provideHandleBlock();

    await initialize();
  });

  it("doesn't create an alert when Scam Detector emits a not monitored alert", async () => {
    const mockAlert: TestAlertEvent = createMockAlertEvent("NOT-MONITORED_ALERT_ID", 32, mockScammerAddress);

    const findings = await handleAlert(mockAlert);

    expect(findings).toStrictEqual([]);
  });

  describe("Fraudulent NFT Order Test Suite", () => {
    const mockBlock = new TestBlockEvent();

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
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates an alert for the first instance of a scammer appearing in scam detector alerts, then creates alerts for subsequent activity in block handler", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploitTwo)];
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
          mockExploitTwo,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockBlockHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitThree),
        createMockErc721Transfer(mockExploitFour),
      ];

      const mockBlockNumber = mockAlertBlockNumber + 3680; // Block number divisible by eth blocks per day
      const eightDaysSinceScammerLastActive = 8;

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, eightDaysSinceScammerLastActive)
        .mockResolvedValue(mockBlockHandlerErc721Transfers);

      mockBlock.setNumber(mockBlockNumber);

      findings = await handleBlock(mockBlock);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitThree,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          eightDaysSinceScammerLastActive,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitFour,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          eightDaysSinceScammerLastActive,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("does not create an alert when there is a legitimate sale/purchase of an NFT", async () => {
      const mockExploitFiveHighTxnValue: MockExploitInfo = {
        exploitTxnHash: mockExploitFive.exploitTxnHash,
        fromAddress: mockExploitFive.fromAddress,
        victimAddress: mockExploitFive.victimAddress,
        stolenTokenAddress: mockExploitFive.stolenTokenAddress,
        stolenTokenName: mockExploitFive.stolenTokenName,
        stolenTokenSymbol: mockExploitFive.stolenTokenSymbol,
        stolenTokenId: mockExploitFive.stolenTokenId,
        stolenTokenAmount: mockExploitFive.stolenTokenAmount,
        stolenTokenDecimals: mockExploitFive.stolenTokenDecimals,
        txnValue: BigNumber.from(40000), // High Txn Value
        blockNumber: mockExploitFive.blockNumber,
      };

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitFiveHighTxnValue),
      ];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddress, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnReceipt: MockTxnReceipt = createMockTxnReceipt(mockExploitFiveHighTxnValue);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitFiveHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnReceipt);

      const mockTxnResponse: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitFiveHighTxnValue
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitFiveHighTxnValue.exploitTxnHash)
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
      const mockExploitSixSameVictim: MockExploitInfo = {
        exploitTxnHash: mockExploitSix.exploitTxnHash,
        fromAddress: mockExploitSix.fromAddress,
        victimAddress: mockExploitFive.victimAddress, // Same victim as mockExploitFive
        stolenTokenAddress: mockExploitSix.stolenTokenAddress,
        stolenTokenName: mockExploitSix.stolenTokenName,
        stolenTokenSymbol: mockExploitSix.stolenTokenSymbol,
        stolenTokenId: mockExploitSix.stolenTokenId,
        stolenTokenAmount: mockExploitSix.stolenTokenAmount,
        stolenTokenDecimals: mockExploitSix.stolenTokenDecimals,
        txnValue: mockExploitSix.txnValue,
        blockNumber: mockExploitSix.blockNumber,
      };

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitFive),
        createMockErc721Transfer(mockExploitSixSameVictim),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressThree, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnReceiptTwo: MockTxnReceipt = createMockTxnReceipt(mockExploitSixSameVictim);

      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitSixSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptTwo);

      const mockTxnResponseTwo: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitSixSameVictim
      );

      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitSixSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressThree
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitFive,
          mockScammerAddressThree,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitSixSameVictim,
          mockScammerAddressThree, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates multiple alerts for the same victim if they were exploited by more than one scammer", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploitSix)];
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
          mockExploitSix,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockExploitSevenSameVictim: MockExploitInfo = {
        exploitTxnHash: mockExploitSeven.exploitTxnHash,
        fromAddress: mockExploitSeven.fromAddress,
        victimAddress: mockExploitSix.victimAddress, // Same victim as mockExploitSix
        stolenTokenAddress: mockExploitSeven.stolenTokenAddress,
        stolenTokenName: mockExploitSeven.stolenTokenName,
        stolenTokenSymbol: mockExploitSeven.stolenTokenSymbol,
        stolenTokenId: mockExploitSeven.stolenTokenId,
        stolenTokenAmount: mockExploitSeven.stolenTokenAmount,
        stolenTokenDecimals: mockExploitSeven.stolenTokenDecimals,
        txnValue: mockExploitSeven.txnValue,
        blockNumber: mockExploitSeven.blockNumber,
      };

      const mockAlertHandlerErc721TransfersTwo: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitSevenSameVictim),
      ];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressFive, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721TransfersTwo);

      const mockTxnReceiptTwo: MockTxnReceipt = createMockTxnReceipt(mockExploitSevenSameVictim);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitSevenSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptTwo);

      const mockTxnResponseTwo: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitSevenSameVictim
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitSevenSameVictim.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);

      mockAlert = createMockAlertEvent(FRAUD_NFT_ORDER_ALERT_ID, mockAlertBlockNumber, mockScammerAddressFive);

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitSevenSameVictim,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates multiple alerts for multiple victims as well as multiple scammers", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitEight),
        createMockErc721Transfer(mockExploitNine),
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
          mockExploitEight,
          mockScammerAddressSix,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitNine,
          mockScammerAddressSix, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockAlertHandlerErc721TransfersTwo: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitTen),
        createMockErc721Transfer(mockExploitEleven),
      ];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressSeven, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721TransfersTwo);

      mockAlert = createMockAlertEvent(FRAUD_NFT_ORDER_ALERT_ID, mockAlertBlockNumber, mockScammerAddressSeven);

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitTen,
          mockScammerAddressSeven,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitEleven,
          mockScammerAddressSeven, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are sales above the threshold within the same payload", async () => {
      const mockExploitThirteenHighTxnValue: MockExploitInfo = {
        exploitTxnHash: mockExploitThirteen.exploitTxnHash,
        fromAddress: mockExploitThirteen.fromAddress,
        victimAddress: mockExploitThirteen.victimAddress,
        stolenTokenAddress: mockExploitThirteen.stolenTokenAddress,
        stolenTokenName: mockExploitThirteen.stolenTokenName,
        stolenTokenSymbol: mockExploitThirteen.stolenTokenSymbol,
        stolenTokenId: mockExploitThirteen.stolenTokenId,
        stolenTokenAmount: mockExploitThirteen.stolenTokenAmount,
        stolenTokenDecimals: mockExploitThirteen.stolenTokenDecimals,
        txnValue: BigNumber.from(40000), // High Txn Value
        blockNumber: mockExploitThirteen.blockNumber,
      };

      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitTwelve),
        createMockErc721Transfer(mockExploitThirteenHighTxnValue),
        createMockErc721Transfer(mockExploitFourteen),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressEight, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnResponseTwo: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitThirteenHighTxnValue
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitThirteenHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseTwo);

      let mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressEight
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitTwelve,
          mockScammerAddressEight,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitFourteen,
          mockScammerAddressEight, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockExploitSixteenHighTxnValue: MockExploitInfo = {
        exploitTxnHash: mockExploitSixteen.exploitTxnHash,
        fromAddress: mockExploitSixteen.fromAddress,
        victimAddress: mockExploitSixteen.victimAddress,
        stolenTokenAddress: mockExploitSixteen.stolenTokenAddress,
        stolenTokenName: mockExploitSixteen.stolenTokenName,
        stolenTokenSymbol: mockExploitSixteen.stolenTokenSymbol,
        stolenTokenId: mockExploitSixteen.stolenTokenId,
        stolenTokenAmount: mockExploitSixteen.stolenTokenAmount,
        stolenTokenDecimals: mockExploitSixteen.stolenTokenDecimals,
        txnValue: BigNumber.from(50000), // High Txn Value
        blockNumber: mockExploitSixteen.blockNumber,
      };

      const mockAlertHandlerErc721TransfersTwo: MockErc721Transfer[] = [
        createMockErc721Transfer(mockExploitFifteen),
        createMockErc721Transfer(mockExploitSixteenHighTxnValue),
        createMockErc721Transfer(mockExploitSeventeen),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressNine, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721TransfersTwo);

      const mockTxnReceiptFive: MockTxnReceipt = createMockTxnReceipt(mockExploitSixteenHighTxnValue);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitSixteenHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptFive);

      const mockTxnResponseFive: MockTxnResponse = createMockTxnResponse(
        mockNftMarketPlaceAddress,
        mockExploitSixteenHighTxnValue
      );
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitSixteenHighTxnValue.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseFive);

      mockAlert = createMockAlertEvent(FRAUD_NFT_ORDER_ALERT_ID, mockAlertBlockNumber, mockScammerAddressNine);

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockExploitFifteen,
          mockScammerAddressNine,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitSeventeen,
          mockScammerAddressNine, // Same scammer
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("does not create an alert when a scammer 'pays' for an NFT with something other than ETH", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploitEighteen)];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTen, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const txnReceiptWithErc20Log = createMockTxnReceiptWithErc20TransferLog(
        mockExploitEighteen,
        mockScammerAddressTen,
        mockErc20TokenAddress,
        100
      );
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitEighteen.exploitTxnHash)
        .mockResolvedValue(txnReceiptWithErc20Log);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressTen
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("does not create an alert when a 'scammer' and 'victim' exchange NFTs with one another", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [createMockErc721Transfer(mockExploitNineteen)];
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressEleven, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const additionalNftTokenId = 225;
      const txnRecipeitWithNftExchangeLogs = createMockTxnReceiptWithNftExchangeLogs(
        mockExploitNineteen,
        mockScammerAddressEleven,
        additionalNftTokenId
      );
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitNineteen.exploitTxnHash)
        .mockResolvedValue(txnRecipeitWithNftExchangeLogs);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        FRAUD_NFT_ORDER_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressEleven
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });
  });

  describe("Ice Phishing Test Suite", () => {
    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-ICE-PHISHING alert when source bot is Nethermind's, alert is not HIGH-NUM-APPROVED-TRANSFERS, and the stolen asset is ERC721", async () => {
      const mockAlertHandlerErc721Transfers: MockIcePhishingTransfer[] = [
        createMockIcePhishingTransfer(mockExploitTwenty),
      ];
      when(mockDataFetcher.getScammerIcePhishingTransfers)
        .calledWith(mockScammerAddress, NINETY_DAYS, mockChainId)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        ICE_PHISHING_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddress,
        { hash: "0xsourceHash", botId: NETHERMIND_ICE_PHISHING_BOT }
      );

      when(mockGetAlerts)
        .calledWith({
          botIds: [NETHERMIND_ICE_PHISHING_BOT, BLOCKSEC_ICE_PHISHING_BOT],
          alertHash: "0xsourceHash",
          blockNumberRange: {
            startBlockNumber: DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.START,
            endBlockNumber: mockAlert.blockNumber ? mockAlert.blockNumber : DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.END,
          },
        })
        .mockResolvedValueOnce({
          alerts: [
            {
              alertId: "ICE-PHISHING-SUSPICIOUS-TRANSFER",
              description: "Transfer",
              metadata: { scammerAddress: mockScammerAddress },
            },
          ],
        });

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingIcePhishingFinding(
          mockExploitTwenty,
          mockScammerAddress,
          ICE_PHISHING_ALERT_ID,
          false,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-ICE-PHISHING alert when source bot is Nethermind's, alert is HIGH-NUM-APPROVED-TRANSFERS, and the stolen asset is ERC20", async () => {
      const mockAlertHandlerErc20Transfers: MockIcePhishingTransfer[] = [
        createMockIcePhishingTransfer(mockErc20Exploit),
      ];

      when(mockDataFetcher.getScammerIcePhishingTransfers)
        .calledWith(mockScammerAddressTwo, NINETY_DAYS, mockChainId)
        .mockResolvedValue(mockAlertHandlerErc20Transfers);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        ICE_PHISHING_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressTwo,
        { hash: "0xsourceHash2", botId: NETHERMIND_ICE_PHISHING_BOT }
      );

      when(mockGetAlerts)
        .calledWith({
          botIds: [NETHERMIND_ICE_PHISHING_BOT, BLOCKSEC_ICE_PHISHING_BOT],
          alertHash: "0xsourceHash2",
          blockNumberRange: {
            startBlockNumber: DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.START,
            endBlockNumber: mockAlert.blockNumber ? mockAlert.blockNumber : DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.END,
          },
        })
        .mockResolvedValueOnce({
          alerts: [
            {
              alertId: "ICE-PHISHING-HIGH-NUM-APPROVED-TRANSFERS",
              description: "Transfer",
              metadata: {
                firstTxHash: "0xfirstTxHash",
                lastTxHash: "0xlastTxHash",
              },
            },
          ],
        });

      when(mockDataFetcher.getTransactionReceipt)
        .calledWith("0xfirstTxHash")
        .mockResolvedValue({
          logs: [
            {
              address: mockErc20TokenAddress,
              topics: [
                utils.id("Transfer(address,address,uint256)"),
                utils.hexZeroPad(utils.hexValue(mockErc20Exploit.victimAddress), 32),
                utils.hexZeroPad(utils.hexValue(mockScammerAddressTwo), 32),
                utils.hexZeroPad(utils.hexValue(Number(mockErc20Exploit.stolenTokenAmount)), 32),
              ],
            },
          ],
        });

      when(mockDataFetcher.getTransactionReceipt)
        .calledWith("0xlastTxHash")
        .mockResolvedValue({
          logs: [
            {
              address: mockErc20TokenAddress,
              topics: [
                utils.id("Transfer(address,address,uint256)"),
                utils.hexZeroPad(utils.hexValue(mockErc20Exploit.victimAddress), 32),
                utils.hexZeroPad(utils.hexValue(mockScammerAddressTwo), 32),
                utils.hexZeroPad(utils.hexValue(Number(mockErc20Exploit.stolenTokenAmount)), 32),
              ],
            },
          ],
        });

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingIcePhishingFinding(
          mockErc20Exploit,
          mockScammerAddressTwo,
          ICE_PHISHING_ALERT_ID,
          true,
          BigNumber.from(12),
          BigNumber.from(12),
          BigNumber.from(12),
          NINETY_DAYS,
          BigNumber.from(12)
        ),
      ]);
    });

    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-ICE-PHISHING alert when source bot is Blocksec's", async () => {
      const mockAlertHandlerErc20Transfers: MockIcePhishingTransfer[] = [
        createMockIcePhishingTransfer(mockErc20ExploitTwo),
      ];

      when(mockDataFetcher.getScammerIcePhishingTransfers)
        .calledWith(mockScammerAddressThree, NINETY_DAYS, mockChainId)
        .mockResolvedValue(mockAlertHandlerErc20Transfers);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        ICE_PHISHING_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressThree,
        { hash: "0xsourceHash3", botId: BLOCKSEC_ICE_PHISHING_BOT }
      );

      when(mockGetAlerts)
        .calledWith({
          botIds: [NETHERMIND_ICE_PHISHING_BOT, BLOCKSEC_ICE_PHISHING_BOT],
          alertHash: "0xsourceHash3",
          blockNumberRange: {
            startBlockNumber: DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.START,
            endBlockNumber: mockAlert.blockNumber ? mockAlert.blockNumber : DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.END,
          },
        })
        .mockResolvedValueOnce({
          alerts: [
            {
              alertId: "Ice-phishing",
              description: "Transfer",
              metadata: { scammerAddress: mockScammerAddressThree },
            },
          ],
        });

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingIcePhishingFinding(
          mockErc20ExploitTwo,
          mockScammerAddressThree,
          ICE_PHISHING_ALERT_ID,
          true,
          BigNumber.from(12),
          BigNumber.from(12),
          BigNumber.from(12),
          NINETY_DAYS,
          BigNumber.from(12)
        ),
      ]);
    });

    it("doesn't create an alert when Scam Detector emits a SCAM-DETECTOR-ICE-PHISHING alert when source alert is from Blocksec's bot for a token approval", async () => {
      const mockAlert: TestAlertEvent = createMockAlertEvent(
        ICE_PHISHING_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressThree,
        { hash: "0xsourceHash4", botId: BLOCKSEC_ICE_PHISHING_BOT }
      );

      when(mockGetAlerts)
        .calledWith({
          botIds: [NETHERMIND_ICE_PHISHING_BOT, BLOCKSEC_ICE_PHISHING_BOT],
          alertHash: "0xsourceHash4",
          blockNumberRange: {
            startBlockNumber: DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.START,
            endBlockNumber: mockAlert.blockNumber ? mockAlert.blockNumber : DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.END,
          },
        })
        .mockResolvedValueOnce({
          alerts: [
            {
              alertId: "Ice-phishing",
              description: "approve", // Approval
              metadata: { scammerAddress: mockScammerAddressThree },
            },
          ],
        });

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("creates multiple alerts for multiple Ice Phishing victims", async () => {
      const mockErc20ExploitSameScammer: MockExploitInfo = {
        exploitTxnHash: utils.hexZeroPad(`0x31320`, 32),
        fromAddress: createAddress(`0x343110`),
        victimAddress: createAddress(`0x343110`),
        stolenTokenAddress: createAddress(`0x311`),
        stolenTokenName: "MockIcePhishingToken3",
        stolenTokenSymbol: "MOCK20-3",
        stolenTokenId: null,
        stolenTokenDecimals: 18,
        stolenTokenAmount: "1000000000000003",
        txnValue: BigNumber.from(3),
        blockNumber: 18000000 + 3,
      };
      const mockAlertHandlerErc20Transfers: MockIcePhishingTransfer[] = [
        createMockIcePhishingTransfer(mockErc20ExploitThree),
        createMockIcePhishingTransfer(mockErc20ExploitSameScammer),
      ];

      when(mockDataFetcher.getScammerIcePhishingTransfers)
        .calledWith(mockScammerAddressFour, NINETY_DAYS, mockChainId)
        .mockResolvedValue(mockAlertHandlerErc20Transfers);

      const mockAlert: TestAlertEvent = createMockAlertEvent(
        ICE_PHISHING_ALERT_ID,
        mockAlertBlockNumber,
        mockScammerAddressFour,
        { hash: "0xsourceHash5", botId: BLOCKSEC_ICE_PHISHING_BOT }
      );

      when(mockGetAlerts)
        .calledWith({
          botIds: [NETHERMIND_ICE_PHISHING_BOT, BLOCKSEC_ICE_PHISHING_BOT],
          alertHash: "0xsourceHash5",
          blockNumberRange: {
            startBlockNumber: DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.START,
            endBlockNumber: mockAlert.blockNumber ? mockAlert.blockNumber : DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.END,
          },
        })
        .mockResolvedValueOnce({
          alerts: [
            {
              alertId: "Ice-phishing",
              description: "Transfer",
              metadata: { scammerAddress: mockScammerAddressFour },
            },
          ],
        });

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingIcePhishingFinding(
          mockErc20ExploitThree,
          mockScammerAddressFour,
          ICE_PHISHING_ALERT_ID,
          true,
          BigNumber.from(12),
          BigNumber.from(12),
          BigNumber.from(12),
          NINETY_DAYS,
          BigNumber.from(12)
        ),
        createTestingIcePhishingFinding(
          mockErc20ExploitSameScammer,
          mockScammerAddressFour,
          ICE_PHISHING_ALERT_ID,
          true,
          BigNumber.from(12),
          BigNumber.from(12),
          BigNumber.from(12),
          NINETY_DAYS,
          BigNumber.from(12)
        ),
      ]);
    });
  });
});
