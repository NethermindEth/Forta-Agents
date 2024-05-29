import {
  Finding,
  Initialize,
  HandleTransaction,
  HandleBlock,
  TransactionEvent as TransactionEventV2,
  FindingSeverity,
  FindingType,
  Label,
  EntityType
} from "@fortanetwork/forta-bot";
import fetch, { Response } from "node-fetch";
import { TestTransactionEvent, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools/lib";

import { provideInitialize, provideHandleTransaction, provideHandleBlock } from "./agent";
import { txEventV1ToV2Converter } from "./txn.v1.to.v2.converter"
import { PersistenceHelper } from "./persistence.helper";

jest.mock("node-fetch");

const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

const mockContract = createAddress("0x1234");
const mockChainId = 1;
const mockDbUrl = "databaseurl.com/";
const mockJwt = "MOCK_JWT";
const mockNonZeroOwnershipTransferKey = "mock-nonzero-ownership-transfers-bot-filecoin-key";
const mockTotalOwnershipTransfersKey = "mock-total-ownership-transfers-bot-filecoin-key";

const mockNonZeroOwnershipTransfers = 12;
const mockTotalOwnershipTransfers = 35;

// Mock the fetchJwt function of the forta-bot module
const mockFetchJwt = jest.fn();
jest.mock("@fortanetwork/forta-bot", () => {
  const original = jest.requireActual("@fortanetwork/forta-bot");
  return {
    ...original,
    fetchJwt: () => mockFetchJwt(),
  };
});

describe("transferred ownership agent", () => {
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let mockFetch = jest.mocked(fetch);
  let mockPersistenceHelper: PersistenceHelper;
  let mockFetchResponse: Response;

  beforeAll(() => {
    mockPersistenceHelper = new PersistenceHelper(mockDbUrl);
  });

  beforeEach(async () => {
    initialize = provideInitialize(
      mockPersistenceHelper,
      mockNonZeroOwnershipTransferKey,
      mockTotalOwnershipTransfersKey
    );
    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchResponse = {
      ok: true,
      json: jest
        .fn()
        .mockResolvedValueOnce(Promise.resolve(mockNonZeroOwnershipTransfers.toString()))
        .mockResolvedValueOnce(Promise.resolve(mockTotalOwnershipTransfers.toString())),
    } as any as Response;

    mockFetchJwt.mockResolvedValue(mockJwt);
    mockFetch.mockResolvedValue(mockFetchResponse);

    await initialize();

    handleTransaction = provideHandleTransaction();
    handleBlock = provideHandleBlock(mockPersistenceHelper, mockNonZeroOwnershipTransferKey, mockTotalOwnershipTransfersKey);
    delete process.env.LOCAL_NODE;
  });

  describe("handleTransaction", () => {
    it("Returns empty findings if there is no event", async () => {
      const txEventV1: TestTransactionEvent = new TestTransactionEvent();
      const txEventV2: TransactionEventV2 = txEventV1ToV2Converter(txEventV1);

      const findings = await handleTransaction(txEventV2, mockProvider as any);
      expect(findings).toStrictEqual([]);
    });

    it("Returns empty findings if there is random event from a non zero address", async () => {
      const randomEvent = "event RandomEvent(address indexed previousOwner, address indexed newOwner)";

      const txEventV1 = new TestTransactionEvent().addEventLog(randomEvent, mockContract, [
        createAddress("0x1"),
        createAddress("0x2"),
      ]);
      const txEventV2: TransactionEventV2 = txEventV1ToV2Converter(txEventV1);


      const findings = await handleTransaction(txEventV2, mockProvider as any);
      expect(findings).toStrictEqual([]);
    });

    it("Returns empty findings if there is ownership transfer event from a zero address", async () => {
      const txEventV1 = new TestTransactionEvent().addEventLog(OWNERSHIP_TRANSFERRED_ABI, mockContract, [
        createAddress("0x0"),
        createAddress("0x2"),
      ]);
      const txEventV2: TransactionEventV2 = txEventV1ToV2Converter(txEventV1);

      const findings = await handleTransaction(txEventV2, mockProvider as any);
      expect(findings).toStrictEqual([]);
    });

    it("Returns findings if there is ownership transfer event from a non zero address", async () => {
      const txEventV1 = new TestTransactionEvent().addEventLog(OWNERSHIP_TRANSFERRED_ABI, mockContract, [
        createAddress("0x1"),
        createAddress("0x2"),
      ]);
      const txEventV2: TransactionEventV2 = txEventV1ToV2Converter(txEventV1);

      const findings = await handleTransaction(txEventV2, mockProvider as any);

      const labels = [
        Label.fromObject({
          entity: txEventV2.transaction.hash,
          entityType: EntityType.Transaction,
          label: "Attack",
          confidence: 0.6,
          remove: false,
        }),
        Label.fromObject({
          entity: txEventV2.from,
          entityType: EntityType.Address,
          label: "Attacker",
          confidence: 0.6,
          remove: false,
        }),
        Label.fromObject({
          entity: createAddress("0x1"),
          entityType: EntityType.Address,
          label: "Victim",
          confidence: 0.6,
          remove: false,
        }),
        Label.fromObject({
          entity: createAddress("0x2"),
          entityType: EntityType.Address,
          label: "Attacker",
          confidence: 0.6,
          remove: false,
        }),
      ];

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Ownership Transfer Detection",
          description: "The ownership transfer is detected.",
          alertId: "NETHFORTA-4",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            from: createAddress("0x1"),
            to: createAddress("0x2"),
            anomalyScore: ((mockNonZeroOwnershipTransfers + 1) / (mockTotalOwnershipTransfers + 1)).toString(),
          },
          addresses: [createAddress("0x0"), createAddress("0x1"), createAddress("0x2")],
          labels,
          source: {
            chains: [{ chainId: txEventV2.network }],
            transactions: [{ chainId: txEventV2.network, hash: txEventV2.hash }],
          },
        }),
      ]);
    });
  });

  // describe("handleBlock", () => {
  //   it("should not persist values because block is not evenly divisible by 240", async () => {
  //     const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

  //     await handleBlock(mockBlockEvent, mockProvider as any);

  //     // Only the three times for the initialize
  //     expect(mockFetchJwt).toHaveBeenCalledTimes(2);
  //     expect(mockFetchResponse.json).toHaveBeenCalledTimes(2);
  //   });

  //   it("should persist the value in a block evenly divisible by 240", async () => {
  //     const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

  //     const spy = jest.spyOn(console, "log").mockImplementation(() => {});

  //     await handleBlock(mockBlockEvent);

  //     expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockNonZeroOwnershipTransfers} to database`);
  //     expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockTotalOwnershipTransfers} to database`);
  //     expect(mockFetchJwt).toHaveBeenCalledTimes(4); // Two during initialization, two in block handler
  //     expect(mockFetch).toHaveBeenCalledTimes(4); // Two during initialization, two in block handler

  //     expect(mockFetch.mock.calls[2][0]).toEqual(
  //       `${mockDbUrl}${mockNonZeroOwnershipTransferKey.concat("-", mockChainId.toString())}`
  //     );
  //     expect(mockFetch.mock.calls[2][1]!.method).toEqual("POST");
  //     expect(mockFetch.mock.calls[2][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
  //     expect(mockFetch.mock.calls[2][1]!.body).toEqual(JSON.stringify(mockNonZeroOwnershipTransfers));

  //     expect(mockFetch.mock.calls[3][0]).toEqual(`${mockDbUrl}${mockTotalOwnershipTransfersKey.concat("-", mockChainId.toString())}`);
  //     expect(mockFetch.mock.calls[3][1]!.method).toEqual("POST");
  //     expect(mockFetch.mock.calls[3][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
  //     expect(mockFetch.mock.calls[3][1]!.body).toEqual(JSON.stringify(mockTotalOwnershipTransfers));
  //   });
  // });
});
