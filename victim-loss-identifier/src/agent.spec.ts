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
import { createAddress } from "forta-agent-tools";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { provideHandleAlert, provideHandleBlock, provideInitialize } from "./agent";
import { TestAlertEvent } from "./mocks/mock.alert";

const ONE_DAY = 60 * 60 * 24;
const NINETY_DAYS = ONE_DAY * 90;

describe("Victim & Loss Identifier Test Suite", () => {
  describe("Fraudulent NFT Order Test Suite", () => {
    const mockBlock = new TestBlockEvent();
    const mockScammerAddress = createAddress("0xdEaDBeEF");
    const mockChainId = 1;
    const mockApiKey = "ApIKeY-123";

    const mockErc721Transfers = [{
      tx_hash: createAddress("0x30"),
      from_address: createAddress("0x31"),
      contract_address: createAddress("0x32"),
      token_name: "MockErc721Token",
      token_symbol: "MOCK721",
      token_id: 33,
    }];

    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const mockApiKeyFetcher = jest.fn();
    const mockErc721TransferFetcher = jest.fn();

    let initialize: Initialize;
    let handleAlert: HandleAlert;
    let handleBlock: HandleBlock;

    beforeAll(() => {
      mockProvider.setNetwork(mockChainId);
    });

    beforeEach(async () => {
      when(mockApiKeyFetcher).calledWith().mockResolvedValue(mockApiKey);
      when(mockErc721TransferFetcher)
        .calledWith(mockScammerAddress, NINETY_DAYS, mockApiKey)
        .mockResolvedValue(mockErc721Transfers);

      initialize = provideInitialize(mockProvider as any, mockApiKeyFetcher);
      await initialize();

      handleAlert = provideHandleAlert(mockProvider as any, mockErc721TransferFetcher);
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
