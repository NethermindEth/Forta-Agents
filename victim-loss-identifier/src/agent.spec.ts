import { Initialize, HandleBlock, HandleAlert, FindingType, FindingSeverity, Finding, ethers } from "forta-agent";
import { BigNumber } from "ethers";
import { createAddress } from "forta-agent-tools";
import { TestBlockEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { TestAlertEvent } from "./mocks/mock.alert";
import { ExtendedMockEthersProvider } from "./mocks/extended.mock.ethers";
import { createTestingFraudNftOrderFinding } from "./mocks/testing.findings";
import { Erc721Transfer } from "./mocks/types";

const ONE_DAY = 60 * 60 * 24;
const NINETY_DAYS = ONE_DAY * 90;

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    const FRAUD_NFT_ORDER_ALERT_ID = "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER";

    const mockBlock = new TestBlockEvent();
    const mockAlertHandlerBlockNumber = 25;
    const mockDayInEthBlockTime = 7200;
    const mockScammerLastActivityInBlockHandler = mockDayInEthBlockTime - mockAlertHandlerBlockNumber;



    const mockScammerAddress = createAddress("0xdEaDBeEF");
    const mockScammerAddressTwo = createAddress("0xdEaDBeEFB");

    const mockExploitTxnHash = createAddress("0x30");
    const mockVictimAddress = createAddress("0x31");
    const mockStolenTokenAddress = createAddress("0x32");
    const mockStolenTokenName = "MockErc721Token";
    const mockStolenTokenSymbol = "MOCK721";
    const mockStolenTokenId = "33";

    const mockExploitTxnHashTwo = createAddress("0x40");
    const mockVictimAddressTwo = createAddress("0x41");
    const mockStolenTokenAddressTwo = createAddress("0x42");
    const mockStolenTokenNameTwo = "MockErc721TokenTwo";
    const mockStolenTokenSymbolTwo = "MOCK721B";
    const mockStolenTokenIdTwo = "43";

    const mockExploitTxnHashThree = createAddress("0x50");
    const mockVictimAddressThree = createAddress("0x51");
    const mockStolenTokenAddressThree = createAddress("0x52");
    const mockStolenTokenNameThree = "MockErc721TokenThree";
    const mockStolenTokenSymbolThree = "MOCK721C";
    const mockStolenTokenIdThree = "53";

    const mockExploitTxnHashFour = createAddress("0x60");
    const mockVictimAddressFour = createAddress("0x61");
    const mockStolenTokenAddressFour = createAddress("0x62");
    const mockStolenTokenNameFour = "MockErc721TokenFour";
    const mockStolenTokenSymbolFour = "MOCK721D";
    const mockStolenTokenIdFour = "63";



    const mockNftMarketPlaceAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
    const mockChainId = 1;
    const mockApiKey = "ApIKeY-123";
    const mockNftFloorPrice = 1000; // in USD

    const mockTxnValue = BigNumber.from(70);
    const mockTxnValueTwo = BigNumber.from(80);
    const mockTxnValueThree = BigNumber.from(90);
    const mockTxnValueFour = BigNumber.from(50000);

    const mockAlertHandlerErc721Transfers: Erc721Transfer[] = [
      {
        transaction_hash: mockExploitTxnHash,
        from_address: mockVictimAddress,
        contract_address: mockStolenTokenAddress,
        name: mockStolenTokenName,
        symbol: mockStolenTokenSymbol,
        token_id: mockStolenTokenId,
        block_time: "string",
        to_address: "string",
      },
    ];
    const mockBlockHandlerErc721Transfers: Erc721Transfer[] = [
      {
        transaction_hash: mockExploitTxnHashTwo,
        from_address: mockVictimAddressTwo,
        contract_address: mockStolenTokenAddressTwo,
        name: mockStolenTokenNameTwo,
        symbol: mockStolenTokenSymbolTwo,
        token_id: mockStolenTokenIdTwo,
        block_time: "string",
        to_address: "string",
      },
      {
        transaction_hash: mockExploitTxnHashThree,
        from_address: mockVictimAddressThree,
        contract_address: mockStolenTokenAddressThree,
        name: mockStolenTokenNameThree,
        symbol: mockStolenTokenSymbolThree,
        token_id: mockStolenTokenIdThree,
        block_time: "string",
        to_address: "string",
      },
    ];
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

    const mockProvider: ExtendedMockEthersProvider = new ExtendedMockEthersProvider();
    const mockApiKeyFetcher = jest.fn();
    const mockErc721TransferFetcher = jest.fn();
    const mockNftCollectionFloorPriceFetcher = jest.fn();

    let initialize: Initialize;
    let handleAlert: HandleAlert;
    let handleBlock: HandleBlock;

    beforeAll(() => {
      mockProvider.setNetwork(mockChainId);
    });

    beforeEach(async () => {
      mockProvider.addTransactionResponse(mockExploitTxnHash, mockNftMarketPlaceAddress, mockTxnValue);
      mockProvider.addTransactionResponse(mockExploitTxnHashTwo, mockNftMarketPlaceAddress, mockTxnValueTwo);
      mockProvider.addTransactionResponse(mockExploitTxnHashThree, mockNftMarketPlaceAddress, mockTxnValueThree);
      mockProvider.addTransactionResponse(mockExploitTxnHashFour, mockNftMarketPlaceAddress, mockTxnValueFour);

      when(mockApiKeyFetcher).calledWith().mockResolvedValue(mockApiKey);

      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddress, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721Transfers);
      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddress, mockScammerLastActivityInBlockHandler, mockApiKey)
        .mockResolvedValue(mockBlockHandlerErc721Transfers);
    when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddressTwo, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockAlertHandlerErc721TransfersFour);

      when(mockNftCollectionFloorPriceFetcher).calledWith().mockResolvedValue(mockNftFloorPrice);

      initialize = provideInitialize(mockProvider as any, mockApiKeyFetcher);
      await initialize();

      handleAlert = provideHandleAlert(
        mockProvider as any,
        mockErc721TransferFetcher,
        mockNftCollectionFloorPriceFetcher
      );
      handleBlock = provideHandleBlock(
        mockProvider as any,
        mockErc721TransferFetcher,
        mockNftCollectionFloorPriceFetcher
      );
    });

    it("creates an alert when Scam Detector emits a SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {
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
      const blockNumber = 33;
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
            number: blockNumber,
          },
        },
        {
          scammer_addresses: mockScammerAddress,
        }
      );

      const findings = await handleAlert(mockAlert);

      expect(findings).toStrictEqual([]);
    });

    it("creates an alert for the first instance of a scammer appearing in scam detector alerts, then creates alerts for subsequent activity in block handler", async () => {
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

      mockBlock.setNumber(mockDayInEthBlockTime);

      findings.push(...(await handleBlock(mockBlock)));

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
        createTestingFraudNftOrderFinding(
          mockVictimAddressTwo,
          mockScammerAddress,
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
          mockScammerAddress,
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

    it.only("does not create an alert when there is a legitimate sale/purchase of an NFT", async () => {
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

    it.skip("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload", async () => {});

    it.skip("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are legimitate sales within the same payload", async () => {});

    it.skip("does not create alerts for an address that was found out to be associated with a particular scammer address", async () => {});

    it.skip("does not create alerts when the value paid for an NFT is higher than the upper limit set", async () => {});

    it.skip("creates multiple alerts for the same victim if they were exploited more than once", async () => {});

    it.skip("creates multiple alerts for multiple victims as well as multiple scammers", async () => {});
  });
});
