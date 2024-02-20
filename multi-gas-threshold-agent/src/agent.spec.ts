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
import { createAddress } from "forta-agent-tools";
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
const mockDetectedInfoGasAlerts = 2;
const mockDetectedTotalGasAlerts = 35;

const mockChainId = 123;
const mockDbUrl = "databaseurl.com/";
const mockJwt = "MOCK_JWT";
const mockMedGasKey = "mock-medium-gas-key";
const mockHighGasKey = "mock-high-gas-key";
const mockInfoGasKey = "mock-info-gas-key";
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
  let mockFetch = jest.mocked(fetch);
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let mockFetchResponse: Response;
  const mockGetTransactionReceipt = jest.fn();

  beforeAll(() => {
    mockProvider = new MockEthersProvider();
    mockPersistenceHelper = new PersistenceHelper(mockDbUrl);
  });

  beforeEach(async () => {
    mockProvider.setNetwork(mockChainId);
    initialize = provideInitialize(
      mockProvider as any,
      mockPersistenceHelper,
      mockMedGasKey,
      mockHighGasKey,
      mockInfoGasKey,
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
        .mockResolvedValueOnce(Promise.resolve(mockDetectedInfoGasAlerts.toString()))
        .mockResolvedValueOnce(Promise.resolve(mockDetectedTotalGasAlerts.toString())),
    } as any as Response;

    mockFetchJwt.mockResolvedValue(mockJwt);
    mockFetch.mockResolvedValue(mockFetchResponse);

    await initialize();

    handleTransaction = provideHandleTransaction(mockGetTransactionReceipt, mockProvider as any);
    handleBlock = provideHandleBlock(
      mockPersistenceHelper,
      mockMedGasKey,
      mockHighGasKey,
      mockInfoGasKey,
      mockAllGasKey
    );
    delete process.env.LOCAL_NODE;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("transaction handler test suite", () => {
    it("Returns empty findings if gas used is below lowest threshold", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      mockGetTransactionReceipt.mockReturnValue({ gasUsed: "500000" });

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns finding with severity Medium if gas used is between 1000000 and 3000000", async () => {
      const mockAnomalyScore = (mockDetectedMediumGasAlerts + 1) / (mockDetectedTotalGasAlerts + 1);

      const txEvent: TransactionEvent = new TestTransactionEvent().setHash("0x1234");
      mockGetTransactionReceipt.mockReturnValue({ gasUsed: MEDIUM_GAS_THRESHOLD, status: true });

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
            anomalyScore:
              mockAnomalyScore.toFixed(2) === "0.00" ? mockAnomalyScore.toString() : mockAnomalyScore.toFixed(2),
          },
          labels: [
            Label.fromObject({
              entityType: EntityType.Transaction,
              entity: "0x1234",
              label: "Suspicious",
              confidence: 0.7,
              remove: false,
            }),
            Label.fromObject({
              entityType: EntityType.Address,
              entity: txEvent.from,
              label: "Attacker",
              confidence: 0.1,
              remove: false,
            }),
          ],
        }),
      ]);
    });

    it("Returns finding with severity High if gas used is greater than or equal to 3000000", async () => {
      const mockAnomalyScore = (mockDetectedHighGasAlerts + 1) / (mockDetectedTotalGasAlerts + 1);

      const txEvent: TransactionEvent = new TestTransactionEvent().setHash("0x1234");
      mockGetTransactionReceipt.mockReturnValue({ gasUsed: HIGH_GAS_THRESHOLD, status: true });

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
            anomalyScore:
              mockAnomalyScore.toFixed(2) === "0.00" ? mockAnomalyScore.toString() : mockAnomalyScore.toFixed(2),
          },
          labels: [
            Label.fromObject({
              entityType: EntityType.Transaction,
              entity: "0x1234",
              label: "Suspicious",
              confidence: 0.7,
              remove: false,
            }),
            Label.fromObject({
              entityType: EntityType.Address,
              entity: txEvent.from,
              label: "Attacker",
              confidence: 0.1,
              remove: false,
            }),
          ],
        }),
      ]);
    });

    it("Returns finding with severity Info if there's a potential airdrop", async () => {
      const mockAnomalyScore = (mockDetectedInfoGasAlerts + 1) / (mockDetectedTotalGasAlerts + 1);
      const transferEvent = "event Transfer(address indexed from, address indexed to, uint256 value)";
      const mockAirdroppedTokenAddress = createAddress("0x1010");
      const mockAirdropSender = createAddress("0x2020");

      let txEvent: TestTransactionEvent = new TestTransactionEvent().setHash("0x1234");

      let numberOfReceivers = 200;

      for (let i = 0; i < numberOfReceivers; i++) {
        const receiver = createAddress(`0x${i}`);
        const data = [mockAirdropSender, receiver, mockAirdroppedTokenAddress];
        txEvent.addEventLog(transferEvent, mockAirdroppedTokenAddress, data);
      }

      mockGetTransactionReceipt.mockReturnValue({ gasUsed: MEDIUM_GAS_THRESHOLD, status: true });

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Gas Use Detection - Potential Airdrop",
          description: `Gas used by Transaction`,
          alertId: "NETHFORTA-1-INFO",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            gas: MEDIUM_GAS_THRESHOLD,
            anomalyScore:
              mockAnomalyScore.toFixed(2) === "0.00" ? mockAnomalyScore.toString() : mockAnomalyScore.toFixed(2),
          },
          labels: [
            Label.fromObject({
              entityType: EntityType.Transaction,
              entity: "0x1234",
              label: "Suspicious",
              confidence: 0.7,
              remove: false,
            }),
            Label.fromObject({
              entityType: EntityType.Address,
              entity: txEvent.from,
              label: "Attacker",
              confidence: 0.1,
              remove: false,
            }),
          ],
        }),
      ]);
    });

    it("Returns no findings for failed transactions", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      mockGetTransactionReceipt.mockReturnValue({ gasUsed: MEDIUM_GAS_THRESHOLD, status: false });

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });
  });

  describe("block handler test suite", () => {
    it("should not persist values because block is not evenly divisible by 240", async () => {
      const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

      await handleBlock(mockBlockEvent);

      // Only the four times for the initialize
      expect(mockFetchJwt).toHaveBeenCalledTimes(4);
      expect(mockFetchResponse.json).toHaveBeenCalledTimes(4);
    });

    it("should persist the value in a block evenly divisible by 240", async () => {
      const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

      const spy = jest.spyOn(console, "log").mockImplementation(() => {});

      await handleBlock(mockBlockEvent);

      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedMediumGasAlerts} to database`);
      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedHighGasAlerts} to database`);
      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedInfoGasAlerts} to database`);
      expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockDetectedTotalGasAlerts} to database`);
      expect(mockFetchJwt).toHaveBeenCalledTimes(8); // Four during initialization, four in block handler
      expect(mockFetch).toHaveBeenCalledTimes(8); // Four during initialization, four in block handler

      expect(mockFetch.mock.calls[4][0]).toEqual(`${mockDbUrl}${mockMedGasKey.concat("-", mockChainId.toString())}`);
      expect(mockFetch.mock.calls[4][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[4][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[4][1]!.body).toEqual(JSON.stringify(mockDetectedMediumGasAlerts));

      expect(mockFetch.mock.calls[5][0]).toEqual(`${mockDbUrl}${mockHighGasKey.concat("-", mockChainId.toString())}`);
      expect(mockFetch.mock.calls[5][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[5][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[5][1]!.body).toEqual(JSON.stringify(mockDetectedHighGasAlerts));

      expect(mockFetch.mock.calls[6][0]).toEqual(`${mockDbUrl}${mockInfoGasKey.concat("-", mockChainId.toString())}`);
      expect(mockFetch.mock.calls[6][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[6][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[6][1]!.body).toEqual(JSON.stringify(mockDetectedInfoGasAlerts));

      expect(mockFetch.mock.calls[7][0]).toEqual(`${mockDbUrl}${mockAllGasKey.concat("-", mockChainId.toString())}`);
      expect(mockFetch.mock.calls[7][1]!.method).toEqual("POST");
      expect(mockFetch.mock.calls[7][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
      expect(mockFetch.mock.calls[7][1]!.body).toEqual(JSON.stringify(mockDetectedTotalGasAlerts));
    });
  });
});
