import { Initialize, HandleBlock, HandleAlert, FindingType, FindingSeverity, Finding, ethers } from "forta-agent";
import { BigNumber } from "ethers";
import { createAddress } from "forta-agent-tools";
import { TestBlockEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { TestAlertEvent } from "./mocks/mock.alert";
import { ExtendedMockEthersProvider } from "./mocks/extended.mock.ethers";
import { createTestingFraudNftOrderFinding } from "./mocks/testing.findings";

const ONE_DAY = 60 * 60 * 24;
const NINETY_DAYS = ONE_DAY * 90;

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    const FRAUD_NFT_ORDER_ALERT_ID = "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER";

    const mockBlock = new TestBlockEvent();

    const mockExploitTxnHash = createAddress("0x30");
    const mockScammerAddress = createAddress("0xdEaDBeEF");
    const mockVictimAddress = createAddress("0x31");
    const mockStolenTokenAddress = createAddress("0x32");
    const mockStolenTokenName = "MockErc721Token";
    const mockStolenTokenSymbol = "MOCK721";
    const mockStolenTokenId = 33;

    const mockNftMarketPlaceAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
    const mockTxnValue = BigNumber.from(90);
    const mockChainId = 1;
    const mockApiKey = "ApIKeY-123";
    const mockNftFloorPrice = 1000; // in USD

    const mockErc721Transfers = [
      {
        tx_hash: mockExploitTxnHash,
        from_address: mockVictimAddress,
        contract_address: mockStolenTokenAddress,
        token_name: mockStolenTokenName,
        token_symbol: mockStolenTokenSymbol,
        token_id: mockStolenTokenId,
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
      when(mockApiKeyFetcher).calledWith().mockResolvedValue(mockApiKey);
      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddress, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockErc721Transfers);
      when(mockNftCollectionFloorPriceFetcher).calledWith().mockResolvedValue(mockNftFloorPrice);

      initialize = provideInitialize(mockProvider as any, mockApiKeyFetcher);
      await initialize();

      handleAlert = provideHandleAlert(
        mockProvider as any,
        mockErc721TransferFetcher,
        mockNftCollectionFloorPriceFetcher
      );
      handleBlock = provideHandleBlock(mockProvider as any);
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

    it.skip("doesn't create an alert when Scam Detector emits a non-SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {});

    it.skip("creates an alert for the first instance of a scammer appearing in scam detector alerts, then creates alerts for subsequent activity in block handler", async () => {});

    it.skip("doesn't create an alert when there is a legitimate sale/purchase of an NFT", async () => {});

    it.skip("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload", async () => {});

    it.skip("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are legimitate sales within the same payload", async () => {});

    it.skip("does not create alerts for an address that was found out to be associated with a particular scammer address", async () => {});

    it.skip("does not create alerts when the value paid for an NFT is higher than the upper limit set", async () => {});
  });
});
