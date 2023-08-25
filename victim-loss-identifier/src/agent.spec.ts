import {
  Initialize,
  HandleBlock,
  HandleAlert,
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
  ethers,
} from "forta-agent";
import { BigNumber } from "ethers";
import { createAddress } from "forta-agent-tools";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { TestAlertEvent } from "./mocks/mock.alert";

const ONE_DAY = 60 * 60 * 24;
const NINETY_DAYS = ONE_DAY * 90;

class ExtendedMockEthersProvider extends MockEthersProvider {
  public getTransaction: any;

  constructor() {
    super();
    this.getTransaction = jest.fn();
  }

  public addTransactionResponse(txnHash: string, txnTo: string, txnValue: BigNumber) {
    when(this.getTransaction).calledWith(txnHash).mockReturnValue({ to: txnTo, value: txnValue });
  }
}

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    const mockBlock = new TestBlockEvent();
    const mockTxnHash = createAddress("0x30");
    const mockScammerAddress = createAddress("0xdEaDBeEF");
    const mockNftMarketPlaceAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
    const mockTxnValue = BigNumber.from(90);
    const mockChainId = 1;
    const mockApiKey = "ApIKeY-123";
    const mockNftFloorPrice = ethers.utils.formatEther("100000000000000000");

    const mockErc721Transfers = [
      {
        tx_hash: mockTxnHash,
        from_address: createAddress("0x31"),
        contract_address: createAddress("0x32"),
        token_name: "MockErc721Token",
        token_symbol: "MOCK721",
        token_id: 33,
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
      mockProvider.addTransactionResponse(mockTxnHash, mockNftMarketPlaceAddress, mockTxnValue);
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
        "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER",
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

      handleAlert(mockAlert);

      /*
        const oneDayInMockChainBlocks = ONE_DAY / 12;
        mockBlock.setNumber(oneDayInMockChainBlocks);

        handleBlock(mockBlock);
        */
    });

    it.skip("doesn't create an alert when Scam Detector emits a non-SCAM-DETECTOR-FRAUDULENT-NFT-ORDER alert", async () => {});

    it.skip("doesn't create an alert when there is a legitimate sale/purchase of an NFT", async () => {});

    it.skip("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload", async () => {});

    it.skip("creates multiple alerts when there are multiple instances of a fraudulent NFT sales in a ERC721 transfer payload, even if there are legimitate sales within the same payload", async () => {});

    it.skip("does not create alerts for an address that was found out to be associated with a particular scammer address", async () => {});

    it.skip("does not create alerts when the value paid for an NFT is higher than the upper limit set", async () => {});
  });
});
