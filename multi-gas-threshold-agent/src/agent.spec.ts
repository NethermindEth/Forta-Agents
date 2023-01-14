import {
  BlockEvent,
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleBlock,
  Network,
  HandleTransaction,
  TransactionEvent,
  Initialize,
} from "forta-agent";
import { TestTransactionEvent, TestBlockEvent } from "forta-agent-tools/lib/test";
// import /*fetch,*/ { Response, ResponseInit } from "node-fetch";
import {
  provideInitialize,
  provideHandleTransaction,
  provideHandleBlock,
  MEDIUM_GAS_THRESHOLD,
  HIGH_GAS_THRESHOLD,
} from "./agent";
import PersistenceHelper from "./persistence.helper";

jest.mock("node-fetch");

const mockMedGasKey = "mock-medium-gas-key";
const mockHighGasKey = "mock-high-gas-key";
const mockAllGasKey = "mock-all-gas-key";

const mockDetectedMediumGasAlerts = 23;
const mockDetectedHighGasAlerts = 12;
const mockDetectedTotalGasAlerts = 35;

const mockDbUrl = "databaseurl.com/";

let mockFetch = jest.fn(); /*jest.mocked(fetch, true)*/
const mockPersistenceHelper: PersistenceHelper = new PersistenceHelper(mockDbUrl, mockFetch);

describe("multi gas threshold agent", () => {
  describe("transaction handler test suite", () => {
    let initialize: Initialize;
    let handleTransaction: HandleTransaction;

    beforeEach(() => {
      initialize = provideInitialize(mockPersistenceHelper, mockMedGasKey, mockHighGasKey, mockAllGasKey);
      initialize();
      handleTransaction = provideHandleTransaction();
    });

    it("Returns empty findings if gas used is below lowest threshold", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent().setGas("500000");
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns finding with severity Medium if gas used is between 1000000 and 3000000", async () => {
      const mockResponseInit: ResponseInit = { status: 202 };

      mockFetch.mockResolvedValueOnce(new Response(mockDetectedMediumGasAlerts.toString(), mockResponseInit));
      mockFetch.mockResolvedValueOnce(new Response(mockDetectedHighGasAlerts.toString(), mockResponseInit));
      mockFetch.mockResolvedValueOnce(new Response(mockDetectedTotalGasAlerts.toString(), mockResponseInit));

      /*
      mockHasOwnProperty.mockReturnValueOnce(false);
      mockFetchJwt.mockResolvedValueOnce(mockJwt);
      mockFetch.mockResolvedValueOnce(Promise.resolve(mockFetchResponse));
      */

      const mockAnomalyScore = (mockDetectedMediumGasAlerts + 1) / (mockDetectedTotalGasAlerts + 1);

      const txEvent: TransactionEvent = new TestTransactionEvent().setGas(MEDIUM_GAS_THRESHOLD);
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
            anomalyScore: mockAnomalyScore.toString(),
          },
        }),
      ]);
    });

    /*
    it("Returns finding with severity High if gas used is greater than or equal to 3000000", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent().setGas(HIGH_GAS_THRESHOLD);
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
          },
        }),
      ]);
    });

    it("Returns empty findings if gasUsed is undefined", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });
    */
  });

  /*
  describe("block handler test suite", () => {
    let initialize: Initialize;
    let handleBlock: HandleBlock;

    beforeEach(async () => {
      initialize = provideInitialize(
        mockPersistenceHelper,
        mockMedGasKey,
        mockHighGasKey,
        mockAllGasKey
      );
      await initialize();
      handleBlock = provideHandleBlock(
        mockPersistenceHelper,
        mockMedGasKey,
        mockHighGasKey,
        mockAllGasKey
      );
    });
    // afterEach(async () => {
    //   mockPersistenceHelper.persist.mockClear();
    // });

    it("should persist the value in a block evenly divisible by 240", async () => {
      const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

      await handleBlock(mockBlockEvent);

      expect(mockPersistenceHelper.persist).toHaveBeenCalledTimes(3);
    });

    it("should not persist values because block is not evenly divisible by 240", async () => {
      const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

      await handleBlock(mockBlockEvent);

      expect(mockPersistenceHelper.persist).toHaveBeenCalledTimes(0);
    });
  });
  */
});
