import { Initialize, HandleBlock, HandleAlert, FindingType, FindingSeverity, Finding, ethers } from "forta-agent";
import { BigNumber, utils, providers } from "ethers";
import { createAddress } from "forta-agent-tools";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { when, resetAllWhenMocks } from "jest-when";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { TestAlertEvent } from "./mocks/mock.alert";
import { createTestingFraudNftOrderFinding } from "./mocks/mock.findings";
import { MockErc721Transfer, MockTxnReceipt, MockTxnResponse } from "./mocks/mock.types";
import { createTxnReceipt, createTxnResponse, createMockErc721Transfer } from "./mocks/mock.utils";
import DataFetcher from "./fetcher";

const ONE_DAY = 60 * 60 * 24;
const NINETY_DAYS = ONE_DAY * 90;
const FRAUD_NFT_ORDER_ALERT_ID = "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER";

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    // ~~~~~~~~~~~~~~~~~~~~~~~~~ mock DataFetcher ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // ~~~~~~~~~~~~~~~~~~~~~~~~~ mock exploit info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const mockChainId = 1;
    const mockAlertBlockNumber = 14;

    const mockBlock = new TestBlockEvent();
    const mockDayInEthBlockTime = 7200;
    const mockScammerLastActivityInBlockHandler = mockDayInEthBlockTime - mockAlertBlockNumber;

    const mockNftMarketPlaceAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
    const mockNftFloorPrice = 1000; // in USD

    let initialize: Initialize;
    let handleAlert: HandleAlert;
    let handleBlock: HandleBlock;
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // ~~~~~~~~~~~~~~~~~~~~~~~~~ mock exploit info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const mockScammerAddress = createAddress("0xdEaDBeEF1");
    const mockScammerAddressTwo = createAddress("0xdEaDBeEF2");
    const mockScammerAddressThree = createAddress("0xdEaDBeEF3");
    const mockScammerAddressFour = createAddress("0xdEaDBeEF4");
    const mockScammerAddressFive = createAddress("0xdEaDBeEF5");
    const mockScammerAddressSix = createAddress("0xdEaDBeEF6");

    const mockExploitTxnHash = utils.hexZeroPad("0x10", 32);
    const mockFromAddress = createAddress("0x110");
    const mockVictimAddress = createAddress("0x111");
    const mockStolenTokenAddress = createAddress("0x12");
    const mockStolenTokenName = "MockErc721TokenOne";
    const mockStolenTokenSymbol = "MOCK721-1";
    const mockStolenTokenId = "13";
    const mockTxnValue = BigNumber.from(10);
    const mockTimestamp = 10000;

    const mockExploitTxnHashTwo = utils.hexZeroPad("0x20", 32);
    const mockFromAddressTwo = createAddress("0x210");
    const mockVictimAddressTwo = createAddress("0x211");
    const mockStolenTokenAddressTwo = createAddress("0x22");
    const mockStolenTokenNameTwo = "MockErc721TokenTwo";
    const mockStolenTokenSymbolTwo = "MOCK721-2";
    const mockStolenTokenIdTwo = "23";
    const mockTxnValueTwo = BigNumber.from(20);
    const mockTimestampTwo = 20000;

    const mockExploitTxnHashThree = utils.hexZeroPad("0x30", 32);
    const mockFromAddressThree = createAddress("0x310");
    const mockVictimAddressThree = createAddress("0x311");
    const mockStolenTokenAddressThree = createAddress("0x32");
    const mockStolenTokenNameThree = "MockErc721TokenThree";
    const mockStolenTokenSymbolThree = "MOCK721-3";
    const mockStolenTokenIdThree = "33";
    const mockTxnValueThree = BigNumber.from(30);
    const mockTimestampThree = 30000;

    const mockExploitTxnHashFour = utils.hexZeroPad("0x40", 32);
    const mockFromAddressFour = createAddress("0x410");
    const mockVictimAddressFour = createAddress("0x411");
    const mockStolenTokenAddressFour = createAddress("0x42");
    const mockStolenTokenNameFour = "MockErc721TokenFour";
    const mockStolenTokenSymbolFour = "MOCK721-4";
    const mockStolenTokenIdFour = "43";
    const mockTxnValueFour = BigNumber.from(40000);
    const mockTimestampFour = 40000;

    const mockExploitTxnHashFive = utils.hexZeroPad("0x50", 32);
    const mockFromAddressFive = createAddress("0x510");
    const mockVictimAddressFive = createAddress("0x511");
    const mockStolenTokenAddressFive = createAddress("0x52");
    const mockStolenTokenNameFive = "MockErc721TokenFive";
    const mockStolenTokenSymbolFive = "MOCK721-5";
    const mockStolenTokenIdFive = "53";
    const mockTxnValueFive = BigNumber.from(50);
    const mockTimestampFive = 50000;

    const mockExploitTxnHashSix = utils.hexZeroPad("0x60", 32);
    const mockFromAddressSix = createAddress("0x610");
    // const mockVictimAddressSix = createAddress("0x611");
    const mockStolenTokenAddressSix = createAddress("0x62");
    const mockStolenTokenNameSix = "MockErc721TokenSix";
    const mockStolenTokenSymbolSix = "MOCK721-6";
    const mockStolenTokenIdSix = "63";
    const mockTxnValueSix = BigNumber.from(60);
    const mockTimestampSix = 60000;
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    beforeEach(async () => {
      resetAllWhenMocks();
      mockProvider.setNetwork(mockChainId);

      initialize = provideInitialize(mockProvider as any, mockDataFetcherCreator);
      await initialize();

      handleAlert = provideHandleAlert();
      handleBlock = provideHandleBlock();
    });

    /*
    afterEach(async () => {
      // delete scammer entry to not
      // persist in between tests
      const fortyDaysInEthBlocks = (ONE_DAY * 40) / 12;
      mockBlock.setNumber(fortyDaysInEthBlocks);

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddress, fortyDaysInEthBlocks - mockAlertBlockNumber)
        .mockResolvedValue([]);
      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, fortyDaysInEthBlocks - mockAlertBlockNumber)
        .mockResolvedValue([]);

      await handleBlock(mockBlock);
    });
    */

    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(
          mockExploitTxnHash,
          mockFromAddress,
          mockStolenTokenAddress,
          mockStolenTokenName,
          mockStolenTokenSymbol,
          mockStolenTokenId
        ),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddress, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnReceipt: MockTxnReceipt = createTxnReceipt(
        mockStolenTokenAddress,
        mockVictimAddress,
        mockStolenTokenId
      );

      const mockTxnResponse: MockTxnResponse = createTxnResponse(
        mockNftMarketPlaceAddress,
        mockTxnValue,
        mockTimestamp
      );

      when(mockDataFetcher.getTransactionReceipt).calledWith(mockExploitTxnHash).mockResolvedValue(mockTxnReceipt);

      when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHash).mockResolvedValue(mockTxnResponse);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockStolenTokenAddress, mockTimestamp)
        .mockResolvedValue(mockNftFloorPrice);

      const mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddress,
        }
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddress,
          mockScammerAddress,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenName,
          mockStolenTokenAddress,
          mockStolenTokenId,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHash,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("doesn't create an alert when Scam Detector emits a non-SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {
      const mockAlert = new TestAlertEvent(
        [],
        "NON-FRAUDULENT_ORDER_ALERT_ID",
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddress,
        }
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it.only("creates an alert for the first instance of a scammer appearing in scam detector alerts, then creates alerts for subsequent activity in block handler", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(
          mockExploitTxnHash,
          mockFromAddress,
          mockStolenTokenAddress,
          mockStolenTokenName,
          mockStolenTokenSymbol,
          mockStolenTokenId
        ),
      ];

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      const mockTxnReceipt: MockTxnReceipt = createTxnReceipt(
        mockStolenTokenAddress,
        mockVictimAddress,
        mockStolenTokenId
      );

      when(mockDataFetcher.getTransactionReceipt).calledWith(mockExploitTxnHash).mockResolvedValue(mockTxnReceipt);

      const mockTxnResponse: MockTxnResponse = createTxnResponse(
        mockNftMarketPlaceAddress,
        mockTxnValue,
        mockTimestamp
      );

      when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHash).mockResolvedValue(mockTxnResponse);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockStolenTokenAddress, mockTimestamp)
        .mockResolvedValue(mockNftFloorPrice);

      const mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressTwo,
        }
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddress,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenName,
          mockStolenTokenAddress,
          mockStolenTokenId,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHash,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockBlockHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(
          mockExploitTxnHashTwo,
          mockFromAddressTwo,
          mockStolenTokenAddressTwo,
          mockStolenTokenNameTwo,
          mockStolenTokenSymbolTwo,
          mockStolenTokenIdTwo
        ),
        createMockErc721Transfer(
          mockExploitTxnHashThree,
          mockFromAddressThree,
          mockStolenTokenAddressThree,
          mockStolenTokenNameThree,
          mockStolenTokenSymbolThree,
          mockStolenTokenIdThree
        ),
      ];

      console.log(`mockScammerLastActivityInBlockHandler: ${mockScammerLastActivityInBlockHandler}`);

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, mockScammerLastActivityInBlockHandler)
        .mockResolvedValue(mockBlockHandlerErc721Transfers);

      const mockTxnReceiptTwo: MockTxnReceipt = createTxnReceipt(
        mockStolenTokenAddressTwo,
        mockVictimAddressTwo,
        mockStolenTokenIdTwo
      );
      const mockTxnReceiptThree: MockTxnReceipt = createTxnReceipt(
        mockStolenTokenAddressThree,
        mockVictimAddressThree,
        mockStolenTokenIdThree
      );

      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitTxnHashTwo)
        .mockResolvedValue(mockTxnReceiptTwo);
      when(mockDataFetcher.getTransactionReceipt)
        .calledWith(mockExploitTxnHashThree)
        .mockResolvedValue(mockTxnReceiptThree);

      const mockTxnResponseTwo: MockTxnResponse = createTxnResponse(
        mockNftMarketPlaceAddress,
        mockTxnValueTwo,
        mockTimestampTwo
      );
      const mockTxnResponseThree: MockTxnResponse = createTxnResponse(
        mockNftMarketPlaceAddress,
        mockTxnValueThree,
        mockTimestampThree
      );

      when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHashTwo).mockResolvedValue(mockTxnResponseTwo);
      when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHashThree).mockResolvedValue(mockTxnResponseThree);

      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockStolenTokenAddressTwo, mockTimestampTwo)
        .mockResolvedValue(mockNftFloorPrice);
      when(mockDataFetcher.getNftCollectionFloorPrice)
        .calledWith(mockStolenTokenAddressThree, mockTimestampThree)
        .mockResolvedValue(mockNftFloorPrice);

      mockBlock.setNumber(mockDayInEthBlockTime);

      findings = await handleBlock(mockBlock);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressTwo,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameTwo,
          mockStolenTokenAddressTwo,
          mockStolenTokenIdTwo,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashTwo,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockVictimAddressThree,
          mockScammerAddressTwo,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameThree,
          mockStolenTokenAddressThree,
          mockStolenTokenIdThree,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashThree,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    /*
    it("does not create an alert when there is a legitimate sale/purchase of an NFT", async () => {
      const mockAlertHandlerErc721Transfers: MockErc721Transfer[] = [
        createMockErc721Transfer(
          mockExploitTxnHashFour,
          mockFromAddressFour,
          mockStolenTokenAddressFour,
          mockStolenTokenNameFour,
          mockStolenTokenSymbolFour,
          mockStolenTokenIdFour
        ),
      ];

      const mockTxnReceipt: MockTxnReceipt = createTxnReceipt(
        mockStolenTokenAddressFour,
        mockVictimAddressFour,
        mockStolenTokenIdFour
      );

      const mockTxnResponse: MockTxnResponse = createTxnResponse(
        mockNftMarketPlaceAddress,
        mockTxnValueFour,
        mockTimestampFour
      );

      when(mockDataFetcher.getScammerErc721Transfers)
        .calledWith(mockScammerAddressTwo, NINETY_DAYS)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);

      when(mockDataFetcher.getTransactionReceipt).calledWith(mockExploitTxnHashFour).mockResolvedValue(mockTxnReceipt);

      when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHashFour).mockResolvedValue(mockTxnResponse);

      const blockNumber = 25;
      const mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: blockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressTwo,
        }
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("creates multiple alerts for the same victim if they were exploited more than once by the same scammer", async () => {
        const mockAlertHandlerErc721TransfersFive: MockErc721Transfer[] = [
          createMockErc721Transfer(
            mockExploitTxnHashFive,
            mockFromAddressFive,
            mockStolenTokenAddressFive,
            mockStolenTokenNameFive,
            mockStolenTokenSymbolFive,
            mockStolenTokenIdFive
          ),
          createMockErc721Transfer(
            mockExploitTxnHashSix,
            mockFromAddressSix,
            mockStolenTokenAddressSix,
            mockStolenTokenNameSix,
            mockStolenTokenSymbolSix,
            mockStolenTokenIdSix
          ),
        ];

        const mockTxnReceipt: MockTxnReceipt = createTxnReceipt(
          mockStolenTokenAddressFive,
          mockVictimAddressFive,
          mockStolenTokenIdFive
        );
        const mockTxnReceiptTwo: MockTxnReceipt = createTxnReceipt(
          mockStolenTokenAddressSix,
          mockVictimAddressFive, // Same victim
          mockStolenTokenIdSix
        );

        const mockTxnResponse: MockTxnResponse = createTxnResponse(
          mockNftMarketPlaceAddress,
          mockTxnValueFive,
          mockTimestampFive
        );
        const mockTxnResponseTwo: MockTxnResponse = createTxnResponse(
          mockNftMarketPlaceAddress,
          mockTxnValueSix,
          mockTimestampSix
        );

        when(mockDataFetcher.getScammerErc721Transfers)
          .calledWith(mockScammerAddress, NINETY_DAYS)
          .mockResolvedValue(mockAlertHandlerErc721TransfersFive);

      when(mockDataFetcher.getTransactionReceipt)
            .calledWith(mockExploitTxnHashFive)
            .mockResolvedValue(mockTxnReceipt);
        when(mockDataFetcher.getTransactionReceipt)
            .calledWith(mockExploitTxnHashSix)
            .mockResolvedValue(mockTxnReceiptTwo);

        when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHashFive).mockResolvedValue(mockTxnResponse);
        when(mockDataFetcher.getTransaction).calledWith(mockExploitTxnHashSix).mockResolvedValue(mockTxnResponseTwo);

        when(mockDataFetcher.getNftCollectionFloorPrice)
          .calledWith(mockStolenTokenAddressFive, mockTimestampFive)
          .mockResolvedValue(mockNftFloorPrice);
        when(mockDataFetcher.getNftCollectionFloorPrice)
          .calledWith(mockStolenTokenAddressSix, mockTimestampSix)
          .mockResolvedValue(mockNftFloorPrice);

      const mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddress,
        }
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressFive,
          mockScammerAddress,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFive,
          mockStolenTokenAddressFive,
          mockStolenTokenIdFive,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFive,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockVictimAddressFive, // Same victim
          mockScammerAddress,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          mockStolenTokenNameSix,
          mockStolenTokenAddressSix,
          mockStolenTokenIdSix,
          BigNumber.from(mockNftFloorPrice).add(mockNftFloorPrice),
          mockExploitTxnHashSix,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    /*
    // Left off here
    it("creates multiple alerts for the same victim if they were exploited by more than one scammers", async () => {
      const mockVictimAddressFour = createAddress("0x61");

      const mockScammerAddressFour = createAddress("0xdEaDBeEFc");

      const mockExploitTxnHashFour = createAddress("0x70");
      const mockStolenTokenAddressFour = createAddress("0x72");
      const mockStolenTokenNameFour = "MockErc721Token4";
      const mockStolenTokenSymbolFour = "MOCK721D4";
      const mockStolenTokenIdFour = "73";

      const mockTxnValueFour = BigNumber.from(70);

      const mockAlertHandlerErc721TransfersFour: Erc721Transfer[] = [
        {
          transaction_hash: mockExploitTxnHashFour,
          from_address: mockVictimAddressFour,
          contract_address: mockStolenTokenAddressFour,
          name: mockStolenTokenNameFour,
          symbol: mockStolenTokenSymbolFour,
          token_id: mockStolenTokenIdFour,
          block_time: "string",
          to_address: "string",
        },
      ];

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressFour, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFour);

      mockProvider.addTransactionResponse(mockExploitTxnHashFour, mockNftMarketPlaceAddress, mockTxnValueFour);

      let mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressFour,
        }
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressFour,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFour,
          mockStolenTokenAddressFour,
          mockStolenTokenIdFour,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFour,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockScammerAddressFive = createAddress("0xdEaDBeEFd");

      const mockExploitTxnHashFive = createAddress("0x80");
      const mockStolenTokenAddressFive = createAddress("0x82");
      const mockStolenTokenNameFive = "MockErc721TokenFive";
      const mockStolenTokenSymbolFive = "MOCK721E";
      const mockStolenTokenIdFive = "83";

      const mockTxnValueFive = BigNumber.from(80);

      const mockAlertHandlerErc721TransfersFive: Erc721Transfer[] = [
        {
          transaction_hash: mockExploitTxnHashFive,
          from_address: mockVictimAddressFour,
          contract_address: mockStolenTokenAddressFive,
          name: mockStolenTokenNameFive,
          symbol: mockStolenTokenSymbolFive,
          token_id: mockStolenTokenIdFive,
          block_time: "string",
          to_address: "string",
        },
      ];

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressFive, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFive);

      mockProvider.addTransactionResponse(mockExploitTxnHashFive, mockNftMarketPlaceAddress, mockTxnValueFive);

      mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressFive,
        }
      );

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressFour,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFive,
          mockStolenTokenAddressFive,
          mockStolenTokenIdFive,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFive,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates multiple alerts for multiple victims as well as multiple scammers", async () => {
      const mockScammerAddressFour = createAddress("0xdEaDBeEFc");

      const mockVictimAddressFour = createAddress("0x60");

      const mockExploitTxnHashFour = createAddress("0x61");
      const mockStolenTokenAddressFour = createAddress("0x62");
      const mockStolenTokenNameFour = "MockErc721TokenSix";
      const mockStolenTokenSymbolFour = "MOCK721-6";
      const mockStolenTokenIdFour = "63";
      const mockTxnValueFour = BigNumber.from(60);

      const mockVictimAddressFive = createAddress("0x70");

      const mockExploitTxnHashFive = createAddress("0x71");
      const mockStolenTokenAddressFive = createAddress("0x72");
      const mockStolenTokenNameFive = "MockErc721TokenSeven";
      const mockStolenTokenSymbolFive = "MOCK721-7";
      const mockStolenTokenIdFive = "73";
      const mockTxnValueFive = BigNumber.from(60);

      const mockAlertHandlerErc721TransfersFour: Erc721Transfer[] = [
        {
          transaction_hash: mockExploitTxnHashFour,
          from_address: mockVictimAddressFour,
          contract_address: mockStolenTokenAddressFour,
          name: mockStolenTokenNameFour,
          symbol: mockStolenTokenSymbolFour,
          token_id: mockStolenTokenIdFour,
          block_time: "string",
          to_address: "string",
        },
        {
          transaction_hash: mockExploitTxnHashFive,
          from_address: mockVictimAddressFive,
          contract_address: mockStolenTokenAddressFive,
          name: mockStolenTokenNameFive,
          symbol: mockStolenTokenSymbolFive,
          token_id: mockStolenTokenIdFive,
          block_time: "string",
          to_address: "string",
        },
      ];

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressFour, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFour);

      mockProvider.addTransactionResponse(mockExploitTxnHashFour, mockNftMarketPlaceAddress, mockTxnValueFour);
      mockProvider.addTransactionResponse(mockExploitTxnHashFive, mockNftMarketPlaceAddress, mockTxnValueFive);

      let mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressFour,
        }
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressFour,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFour,
          mockStolenTokenAddressFour,
          mockStolenTokenIdFour,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFour,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockVictimAddressFive,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFive,
          mockStolenTokenAddressFive,
          mockStolenTokenIdFive,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFive,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockScammerAddressFive = createAddress("0xdEaDBeEFd");

      const mockVictimAddressSix = createAddress("0x80");

      const mockExploitTxnHashSix = createAddress("0x81");
      const mockStolenTokenAddressSix = createAddress("0x82");
      const mockStolenTokenNameSix = "MockErc721TokenEight";
      const mockStolenTokenSymbolSix = "MOCK721-8";
      const mockStolenTokenIdSix = "83";
      const mockTxnValueSix = BigNumber.from(80);

      const mockVictimAddressSeven = createAddress("0x90");

      const mockExploitTxnHashSeven = createAddress("0x91");
      const mockStolenTokenAddressSeven = createAddress("0x92");
      const mockStolenTokenNameSeven = "MockErc721TokenNine";
      const mockStolenTokenSymbolSeven = "MOCK721-9";
      const mockStolenTokenIdSeven = "93";
      const mockTxnValueSeven = BigNumber.from(90);

      const mockAlertHandlerErc721TransfersFive: Erc721Transfer[] = [
        {
          transaction_hash: mockExploitTxnHashSix,
          from_address: mockVictimAddressSix,
          contract_address: mockStolenTokenAddressSix,
          name: mockStolenTokenNameSix,
          symbol: mockStolenTokenSymbolSix,
          token_id: mockStolenTokenIdSix,
          block_time: "string",
          to_address: "string",
        },
        {
          transaction_hash: mockExploitTxnHashSeven,
          from_address: mockVictimAddressSeven,
          contract_address: mockStolenTokenAddressSeven,
          name: mockStolenTokenNameSeven,
          symbol: mockStolenTokenSymbolSeven,
          token_id: mockStolenTokenIdSeven,
          block_time: "string",
          to_address: "string",
        },
      ];

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressFive, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFive);

      mockProvider.addTransactionResponse(mockExploitTxnHashSix, mockNftMarketPlaceAddress, mockTxnValueSix);
      mockProvider.addTransactionResponse(mockExploitTxnHashSeven, mockNftMarketPlaceAddress, mockTxnValueSeven);

      mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressFive,
        }
      );

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressSix,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameSix,
          mockStolenTokenAddressSix,
          mockStolenTokenIdSix,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashSix,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockVictimAddressSeven,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameSeven,
          mockStolenTokenAddressSeven,
          mockStolenTokenIdSeven,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashSeven,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });

    it("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are sales above the threshold within the same payload", async () => {
      const mockScammerAddressFour = createAddress("0xdEaDBeEFc");

      const mockVictimAddressFour = createAddress("0x60");

      const mockExploitTxnHashFour = createAddress("0x61");
      const mockStolenTokenAddressFour = createAddress("0x62");
      const mockStolenTokenNameFour = "MockErc721TokenSix";
      const mockStolenTokenSymbolFour = "MOCK721-6";
      const mockStolenTokenIdFour = "63";
      const mockTxnValueFour = BigNumber.from(60);

      const mockSenderAddress = createAddress("0x10");

      const mockRegularTxnHash = createAddress("0x11");
      const mockTokenAddress = createAddress("0x12");
      const mockTokenName = "MockErc721TokenOne";
      const mockTokenSymbol = "MOCK721-1";
      const mockTokenId = "13";
      const mockHighTxnValue = BigNumber.from(2000);

      const mockVictimAddressFive = createAddress("0x70");

      const mockExploitTxnHashFive = createAddress("0x71");
      const mockStolenTokenAddressFive = createAddress("0x72");
      const mockStolenTokenNameFive = "MockErc721TokenSeven";
      const mockStolenTokenSymbolFive = "MOCK721-7";
      const mockStolenTokenIdFive = "73";
      const mockTxnValueFive = BigNumber.from(60);

      const mockAlertHandlerErc721TransfersFour: Erc721Transfer[] = [
        {
          transaction_hash: mockExploitTxnHashFour,
          from_address: mockVictimAddressFour,
          contract_address: mockStolenTokenAddressFour,
          name: mockStolenTokenNameFour,
          symbol: mockStolenTokenSymbolFour,
          token_id: mockStolenTokenIdFour,
          block_time: "string",
          to_address: "string",
        },
        {
          transaction_hash: mockRegularTxnHash,
          from_address: mockSenderAddress,
          contract_address: mockTokenAddress,
          name: mockTokenName,
          symbol: mockTokenSymbol,
          token_id: mockTokenId,
          block_time: "string",
          to_address: "string",
        },
        {
          transaction_hash: mockExploitTxnHashFive,
          from_address: mockVictimAddressFive,
          contract_address: mockStolenTokenAddressFive,
          name: mockStolenTokenNameFive,
          symbol: mockStolenTokenSymbolFive,
          token_id: mockStolenTokenIdFive,
          block_time: "string",
          to_address: "string",
        },
      ];

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressFour, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFour);

      mockProvider.addTransactionResponse(mockExploitTxnHashFour, mockNftMarketPlaceAddress, mockTxnValueFour);
      mockProvider.addTransactionResponse(mockRegularTxnHash, mockNftMarketPlaceAddress, mockHighTxnValue);
      mockProvider.addTransactionResponse(mockExploitTxnHashFive, mockNftMarketPlaceAddress, mockTxnValueFive);

      let mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressFour,
        }
      );

      let findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressFour,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFour,
          mockStolenTokenAddressFour,
          mockStolenTokenIdFour,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFour,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockVictimAddressFive,
          mockScammerAddressFour,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameFive,
          mockStolenTokenAddressFive,
          mockStolenTokenIdFive,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashFive,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);

      const mockScammerAddressFive = createAddress("0xdEaDBeEFd");

      const mockVictimAddressSix = createAddress("0x80");

      const mockExploitTxnHashSix = createAddress("0x81");
      const mockStolenTokenAddressSix = createAddress("0x82");
      const mockStolenTokenNameSix = "MockErc721TokenEight";
      const mockStolenTokenSymbolSix = "MOCK721-8";
      const mockStolenTokenIdSix = "83";
      const mockTxnValueSix = BigNumber.from(80);

      const mockSenderAddressTwo = createAddress("0x10");

      const mockRegularTxnHashTwo = createAddress("0x11");
      const mockTokenAddressTwo = createAddress("0x12");
      const mockTokenNameTwo = "MockErc721TokenOne";
      const mockTokenSymbolTwo = "MOCK721-1";
      const mockTokenIdTwo = "13";
      const mockHighTxnValueTwo = BigNumber.from(2000);

      const mockVictimAddressSeven = createAddress("0x90");

      const mockExploitTxnHashSeven = createAddress("0x91");
      const mockStolenTokenAddressSeven = createAddress("0x92");
      const mockStolenTokenNameSeven = "MockErc721TokenNine";
      const mockStolenTokenSymbolSeven = "MOCK721-9";
      const mockStolenTokenIdSeven = "93";
      const mockTxnValueSeven = BigNumber.from(90);

      const mockAlertHandlerErc721TransfersFive: Erc721Transfer[] = [
        {
          transaction_hash: mockExploitTxnHashSix,
          from_address: mockVictimAddressSix,
          contract_address: mockStolenTokenAddressSix,
          name: mockStolenTokenNameSix,
          symbol: mockStolenTokenSymbolSix,
          token_id: mockStolenTokenIdSix,
          block_time: "string",
          to_address: "string",
        },
        {
          transaction_hash: mockRegularTxnHashTwo,
          from_address: mockSenderAddressTwo,
          contract_address: mockTokenAddressTwo,
          name: mockTokenNameTwo,
          symbol: mockTokenSymbolTwo,
          token_id: mockTokenIdTwo,
          block_time: "string",
          to_address: "string",
        },
        {
          transaction_hash: mockExploitTxnHashSeven,
          from_address: mockVictimAddressSeven,
          contract_address: mockStolenTokenAddressSeven,
          name: mockStolenTokenNameSeven,
          symbol: mockStolenTokenSymbolSeven,
          token_id: mockStolenTokenIdSeven,
          block_time: "string",
          to_address: "string",
        },
      ];

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressFive, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFive);

      mockProvider.addTransactionResponse(mockExploitTxnHashSix, mockNftMarketPlaceAddress, mockTxnValueSix);
      mockProvider.addTransactionResponse(mockRegularTxnHashTwo, mockNftMarketPlaceAddress, mockHighTxnValueTwo);
      mockProvider.addTransactionResponse(mockExploitTxnHashSeven, mockNftMarketPlaceAddress, mockTxnValueSeven);

      mockAlert = new TestAlertEvent(
        [],
        FRAUD_NFT_ORDER_ALERT_ID,
        "",
        [],
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        [],
        1,
        [],
        {
          block: {
            timestamp: "string",
            chainId: 1,
            hash: "",
            number: mockAlertHandlerBlockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddressFive,
        }
      );

      findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([
        createTestingFraudNftOrderFinding(
          mockVictimAddressSix,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameSix,
          mockStolenTokenAddressSix,
          mockStolenTokenIdSix,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashSix,
          BigNumber.from(mockNftFloorPrice)
        ),
        createTestingFraudNftOrderFinding(
          mockVictimAddressSeven,
          mockScammerAddressFive,
          FRAUD_NFT_ORDER_ALERT_ID,
          BigNumber.from(mockNftFloorPrice),
          mockStolenTokenNameSeven,
          mockStolenTokenAddressSeven,
          mockStolenTokenIdSeven,
          BigNumber.from(mockNftFloorPrice),
          mockExploitTxnHashSeven,
          BigNumber.from(mockNftFloorPrice)
        ),
      ]);
    });
    */
  });
});
