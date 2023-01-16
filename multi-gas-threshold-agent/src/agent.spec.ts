import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  Initialize,
  Label,
  EntityType,
} from "forta-agent";
import { TestTransactionEvent, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import fetch, { Response } from "node-fetch";
import {
  provideInitialize,
  provideHandleTransaction,
  provideHandleBlock,
  MEDIUM_GAS_THRESHOLD,
  HIGH_GAS_THRESHOLD,
} from "./agent";
import { PersistenceHelper } from "./persistence.helper";

jest.mock("node-fetch");

const mockDetectedMediumGasAlerts = 23;
const mockDetectedHighGasAlerts = 12;
const mockDetectedTotalGasAlerts = 35;

const mockChainId = 123;
const mockDbUrl = "databaseurl.com/";
const mockJwt = {
  token: {
    iss: "issuer",
    sub: "0x556f8BE42f76c01F960f32CB1936D2e0e0Eb3F4D",
    aud: "recipient",
    exp: 1660119443,
    nbf: 1660119383,
    iat: 1660119413,
    jti: "qkd5cfad-1884-11ed-a5c9-02420a639308",
    "bot-id": "0x13k387b37769ce24236c403e76fc30f01fa774176e1416c861yfe6c07dfef71f",
  },
};
const mockMedGasKey = "mock-medium-gas-key";
const mockHighGasKey = "mock-high-gas-key";
const mockAllGasKey = "mock-all-gas-key";

// Mock the fetchJwt function of the forta-agent module
const mockFetchJwt = jest.fn();
jest.mock("forta-agent", () => {
  const original = jest.requireActual("forta-agent");
  return {
    ...original,
    fetchJwt: () => mockFetchJwt(),
  };
});

describe("multi gas threshold agent", () => {
  let mockPersistenceHelper: PersistenceHelper;
  let mockProvider: MockEthersProvider;
  let mockFetch = jest.mocked(fetch, true);
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let mockFetchResponse: Response;

  beforeAll(() => {
    mockProvider = new MockEthersProvider();
    mockPersistenceHelper = new PersistenceHelper(mockDbUrl);
  });

  beforeEach(() => {
    mockProvider.setNetwork(mockChainId);
    initialize = provideInitialize(
      mockProvider as any,
      mockPersistenceHelper,
      mockMedGasKey,
      mockHighGasKey,
      mockAllGasKey
    );
    const mockEnv = {};
    Object.assign(process.env, mockEnv);

    mockFetchResponse = {
      ok: true,
      json: jest
        .fn()
        .mockResolvedValueOnce(Promise.resolve(mockDetectedMediumGasAlerts.toString()))
        .mockResolvedValueOnce(Promise.resolve(mockDetectedHighGasAlerts.toString()))
        .mockResolvedValueOnce(Promise.resolve(mockDetectedTotalGasAlerts.toString())),
    } as any as Response;

    mockFetchJwt.mockResolvedValue(mockJwt);
    mockFetch.mockResolvedValue(mockFetchResponse);

    initialize();

    handleTransaction = provideHandleTransaction();
    handleBlock = provideHandleBlock(mockPersistenceHelper, mockMedGasKey, mockHighGasKey, mockAllGasKey);
    delete process.env.LOCAL_NODE;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("transaction handler test suite", () => {
    it("Returns empty findings if gas used is below lowest threshold", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent().setGas("500000");
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns finding with severity Medium if gas used is between 1000000 and 3000000", async () => {
      const mockAnomalyScore = (mockDetectedMediumGasAlerts + 1) / (mockDetectedTotalGasAlerts + 1);

      const txEvent: TransactionEvent = new TestTransactionEvent().setHash("0x1234").setGas(MEDIUM_GAS_THRESHOLD);
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Gas Use Detection",
          description: `Gas used by Transaction`,
          alertId: "NETHFORTA-1",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: {
            gas: MEDIUM_GAS_THRESHOLD,
            anomalyScore: mockAnomalyScore.toFixed(2).toString(),
          },
          labels: [
            Label.fromObject({
              entityType: EntityType.Transaction,
              entity: "0x1234",
              label: "High Gas Transaction",
              confidence: 1,
            }),
          ]
        }),
      ]);
    });

    it("Returns finding with severity High if gas used is greater than or equal to 3000000", async () => {
      const mockAnomalyScore = (mockDetectedHighGasAlerts + 1) / (mockDetectedTotalGasAlerts + 1);

      const txEvent: TransactionEvent = new TestTransactionEvent().setHash("0x1234").setGas(HIGH_GAS_THRESHOLD);
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Gas Use Detection",
          description: `Gas used by Transaction`,
          alertId: "NETHFORTA-1",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            gas: HIGH_GAS_THRESHOLD,
            anomalyScore: mockAnomalyScore.toFixed(2).toString(),
          },
          labels: [
            Label.fromObject({
              entityType: EntityType.Transaction,
              entity: "0x1234",
              label: "High Gas Transaction",
              confidence: 1,
            }),
          ]
        }),
      ]);
    });

    it("Returns empty findings if gasUsed is undefined", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });
  });

  describe("block handler test suite", () => {
    it("should not persist values because block is not evenly divisible by 240", async () => {
      const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

      await handleBlock(mockBlockEvent);

      // Only the three times for the initialize
      expect(mockFetchJwt).toHaveBeenCalledTimes(3);
      expect(mockFetchResponse.json).toHaveBeenCalledTimes(3);
    });

    it("should persist the value in a block evenly divisible by 240", async () => {
      const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

      const spy = jest.spyOn(console, "log").mockImplementation(() => {});

      await handleBlock(mockBlockEvent);

      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedMediumGasAlerts} to database`);
      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedHighGasAlerts} to database`);
      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedHighGasAlerts} to database`);
      expect(mockFetchJwt).toHaveBeenCalledTimes(6); // Three during initialization, three in block handler
      expect(mockFetch).toHaveBeenCalledTimes(6); // Three during initialization, three in block handler

      /*
      expect(mockFetch.mock.calls[3][0]).toEqual(`${mockDbUrl}${mockMedGasKey}`);
      expect(mockFetch.mock.calls[3][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[3][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[3][1]!.body).toEqual(JSON.stringify(mockDetectedMediumGasAlerts));

      expect(mockFetch.mock.calls[4][0]).toEqual(`${mockDbUrl}${mockHighGasKey}`);
      expect(mockFetch.mock.calls[4][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[4][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[4][1]!.body).toEqual(JSON.stringify(mockDetectedHighGasAlerts));

      expect(mockFetch.mock.calls[5][0]).toEqual(`${mockDbUrl}${mockAllGasKey}`);
      expect(mockFetch.mock.calls[5][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[5][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[5][1]!.body).toEqual(JSON.stringify(mockAllGasKey));
      */
    });
  });
});
