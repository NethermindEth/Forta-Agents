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
  createMockTxnReceiptWithErc20TransferLog,
  createMockTxnReceiptWithNftExchangeLogs,
  createMockScammerAddressBatch,
  createMockTxnResponseBatch,
  createMockTxnReceiptBatch,
  createMockErc721Transfer,
  createMockExploitBatch,
  createMockTxnResponse,
  createMockTxnReceipt,
  createMockAlertEvent,
} from "./mocks/mock.utils";
import { createAddress } from "forta-agent-tools";

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
    const mockErc20TokenAddress = createAddress("0x12345");

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

    const mockExploitBatch: MockExploitInfo[] = createMockExploitBatch(19);
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
    ]: MockExploitInfo[] = mockExploitBatch;

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
      mockTxnReceiptSeventeen, // mockTxnReceiptEighteen,
      // mockTxnReceiptNineteen,
    ]: MockTxnReceipt[] = createMockTxnReceiptBatch(mockExploitBatch);
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
      mockTxnResponseSeventeen, // mockTxnResponseEighteen,
      // mockTxnResponseNineteen,
    ]: MockTxnResponse[] = createMockTxnResponseBatch(mockNftMarketPlaceAddress, mockExploitBatch);
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
      /*
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitEighteen.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptEighteen);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitNineteen.exploitTxnHash)
        .mockResolvedValue(mockTxnReceiptNineteen);
      */

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
      /*
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitEighteen.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseEighteen);
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitNineteen.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseNineteen);
      */

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
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitFive.stolenTokenAddress, mockExploitFive.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSix.stolenTokenAddress, mockExploitSix.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSeven.stolenTokenAddress, mockExploitSeven.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitEight.stolenTokenAddress, mockExploitEight.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitNine.stolenTokenAddress, mockExploitNine.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitTen.stolenTokenAddress, mockExploitTen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitEleven.stolenTokenAddress, mockExploitEleven.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitTwelve.stolenTokenAddress, mockExploitTwelve.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitThirteen.stolenTokenAddress, mockExploitThirteen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitFourteen.stolenTokenAddress, mockExploitFourteen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitFifteen.stolenTokenAddress, mockExploitFifteen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSixteen.stolenTokenAddress, mockExploitSixteen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSeventeen.stolenTokenAddress, mockExploitSeventeen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      /*
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitEighteen.stolenTokenAddress, mockExploitEighteen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitNineteen.stolenTokenAddress, mockExploitNineteen.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);
      */

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
          NINETY_DAYS,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("doesn't create an alert when Scam Detector emits a non SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {
      const mockAlert: TestAlertEvent = createMockAlertEvent(
        "NON-FRAUDULENT_ORDER_ALERT_ID",
        mockAlertBlockNumber,
        mockScammerAddress
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("creates an alert for the first instance of a scammer appearing in scam detector alerts, then creates alerts for subsequent activity in block handler", async () => {
      // Clear state for mockScammerAddress
      when(mockDataFetcher.getScammerErc721Transfers).calledWith(mockScammerAddress, 1).mockResolvedValue([]);

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

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, 1)
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
          ONE_DAY,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockExploitFour,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          BigNumber.from(mockNftFloorPrice),
          ONE_DAY,
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

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSixSameVictim.stolenTokenAddress, mockExploitSixSameVictim.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

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

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitSevenSameVictim.stolenTokenAddress, mockExploitSevenSameVictim.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

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

      const mockTxnResponseFour: MockTxnResponse = createMockTxnResponse(mockNftMarketPlaceAddress, mockExploitFour);
      when(mockDataFetcher.getTransaction)
        .calledWith(mockExploitFour.exploitTxnHash)
        .mockResolvedValue(mockTxnResponseFour);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockExploitFour.stolenTokenAddress, mockExploitFour.blockNumber)
        .mockResolvedValue(mockNftFloorPrice);

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

      const txnRecipeitWithErc20Log = createMockTxnReceiptWithErc20TransferLog(
        mockExploitEighteen,
        mockScammerAddressTen,
        mockErc20TokenAddress,
        100
      );
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitEighteen.exploitTxnHash)
        .mockResolvedValue(txnRecipeitWithErc20Log);

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
});
