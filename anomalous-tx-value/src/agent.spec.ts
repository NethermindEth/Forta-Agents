// import {
//   FindingType,
//   FindingSeverity,
//   Finding,
//   Initialize,
//   HandleTransaction,
//   HandleBlock,
//   Network,
//   Label,
//   EntityType,
// } from "forta-agent";
// import { NetworkManager } from "forta-agent-tools";
// import { MockEthersProvider, TestTransactionEvent, TestBlockEvent } from "forta-agent-tools/lib/test";
// import fetch, { Response } from "node-fetch";
// import { provideInitialize, provideHandleTransaction, provideHandleBlock } from "./agent";
// import { AgentConfig, NetworkData } from "./utils";
// import { PersistenceHelper } from "./persistence.helper";

// jest.mock("node-fetch");

// const mockAnomalousValueTxns = 12;
// const mockAllTxnsWithValue = 35;

// const mockChainId = 1;
// const mockDbUrl = "databaseurl.com/";
// const mockJwt = "MOCK_JWT";
// const mockAnomalousValueKey = "mock-anomalous-value-bot-key";
// const mockAllValueKey = "mock-any-txn-value-bot-key";

// // Mock the fetchJwt function of the forta-agent module
// const mockFetchJwt = jest.fn();
// jest.mock("forta-agent", () => {
//   const original = jest.requireActual("forta-agent");
//   return {
//     ...original,
//     fetchJwt: () => mockFetchJwt(),
//   };
// });

// const DECIMALS = 10 ** 18;
// const DEFAULT_CONFIG: AgentConfig = {
//   [Network.MAINNET]: {
//     threshold: `${100 * DECIMALS}`,
//   },
// };

// describe("Detect Very High Txn Value", () => {
//   let mockPersistenceHelper: PersistenceHelper;
//   let mockProvider: MockEthersProvider;
//   let mockFetch = jest.mocked(fetch, true);
//   let initialize: Initialize;
//   let handleTransaction: HandleTransaction;
//   let handleBlock: HandleBlock;
//   let networkManager: NetworkManager<NetworkData>;
//   let mockFetchResponse: Response;

//   beforeAll(() => {
//     mockProvider = new MockEthersProvider();
//     mockPersistenceHelper = new PersistenceHelper(mockDbUrl);
//     networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
//   });

//   beforeEach(async () => {
//     mockProvider.setNetwork(mockChainId);
//     initialize = provideInitialize(
//       networkManager,
//       mockProvider as any,
//       mockPersistenceHelper,
//       mockAnomalousValueKey,
//       mockAllValueKey
//     );
//     const mockEnv = {};
//     Object.assign(process.env, mockEnv);

//     mockFetchResponse = {
//       ok: true,
//       json: jest
//         .fn()
//         .mockResolvedValueOnce(Promise.resolve(mockAnomalousValueTxns.toString()))
//         .mockResolvedValueOnce(Promise.resolve(mockAllTxnsWithValue.toString())),
//     } as any as Response;

//     mockFetchJwt.mockResolvedValue(mockJwt);
//     mockFetch.mockResolvedValue(mockFetchResponse);

//     await initialize();

//     handleTransaction = provideHandleTransaction(networkManager);
//     handleBlock = provideHandleBlock(mockPersistenceHelper, mockAnomalousValueKey, mockAllValueKey);
//     delete process.env.LOCAL_NODE;
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe("Transaction handler test suite", () => {
//     it("returns empty findings if value is below threshold", async () => {
//       const txEvent = new TestTransactionEvent();

//       txEvent.setValue(`${1 * DECIMALS}`);
//       const findings = await handleTransaction(txEvent);

//       expect(findings).toStrictEqual([]);
//     });

//     it("returns empty findings if value is equal to threshold", async () => {
//       const txEvent = new TestTransactionEvent();

//       txEvent.setValue(`${100 * DECIMALS}`);

//       const findings = await handleTransaction(txEvent);
//       expect(findings).toStrictEqual([]);
//     });

//     it("returns a finding if value is above threshold", async () => {
//       // Adding one to each for the current transaction
//       const mockAnomalyScore = (mockAnomalousValueTxns + 1) / (mockAllTxnsWithValue + 1);

//       const txEvent = new TestTransactionEvent().setHash("0x1234");
//       const value = 101 * DECIMALS;

//       txEvent.setValue(`${value}`);

//       const findings = await handleTransaction(txEvent);
//       expect(findings).toStrictEqual([
//         Finding.fromObject({
//           name: "High Value Use Detection",
//           description: "High value is used.",
//           alertId: "NETHFORTA-2",
//           severity: FindingSeverity.High,
//           type: FindingType.Suspicious,
//           metadata: {
//             value: value.toString(),
//             anomalyScore:
//               mockAnomalyScore.toFixed(2) === "0.00" ? mockAnomalyScore.toString() : mockAnomalyScore.toFixed(2),
//           },
//           labels: [
//             Label.fromObject({
//               entityType: EntityType.Transaction,
//               entity: txEvent.hash,
//               label: "Suspicious",
//               confidence: 0.6,
//               remove: false,
//             }),
//             Label.fromObject({
//               entityType: EntityType.Address,
//               entity: txEvent.from,
//               label: "Attacker",
//               confidence: 0.1,
//               remove: false,
//             }),
//           ],
//         }),
//       ]);
//     });
//   });

//   describe("Block handler test suite", () => {
//     it("should not persist values because block is not evenly divisible by 240", async () => {
//       const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

//       await handleBlock(mockBlockEvent);

//       // Only the three times for the initialize
//       expect(mockFetchJwt).toHaveBeenCalledTimes(2);
//       expect(mockFetchResponse.json).toHaveBeenCalledTimes(2);
//     });

//     it("should persist the value in a block evenly divisible by 240", async () => {
//       const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

//       const spy = jest.spyOn(console, "log").mockImplementation(() => {});

//       await handleBlock(mockBlockEvent);

//       expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockAnomalousValueTxns} to database`);
//       expect(spy).toHaveBeenCalledWith(`successfully persisted ${mockAllTxnsWithValue} to database`);
//       expect(mockFetchJwt).toHaveBeenCalledTimes(4); // Two during initialization, two in block handler
//       expect(mockFetch).toHaveBeenCalledTimes(4); // Two during initialization, two in block handler

//       expect(mockFetch.mock.calls[2][0]).toEqual(
//         `${mockDbUrl}${mockAnomalousValueKey.concat("-", mockChainId.toString())}`
//       );
//       expect(mockFetch.mock.calls[2][1]!.method).toEqual("POST");
//       expect(mockFetch.mock.calls[2][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
//       expect(mockFetch.mock.calls[2][1]!.body).toEqual(JSON.stringify(mockAnomalousValueTxns));

//       expect(mockFetch.mock.calls[3][0]).toEqual(`${mockDbUrl}${mockAllValueKey.concat("-", mockChainId.toString())}`);
//       expect(mockFetch.mock.calls[3][1]!.method).toEqual("POST");
//       expect(mockFetch.mock.calls[3][1]!.headers).toEqual({ Authorization: `Bearer ${mockJwt}` });
//       expect(mockFetch.mock.calls[3][1]!.body).toEqual(JSON.stringify(mockAllTxnsWithValue));
//     });
//   });
// });
