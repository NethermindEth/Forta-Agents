import {
  Finding,
  HandleTransaction,
  TransactionEvent as TransactionEventV2,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
  createTransactionEvent
} from "forta-bot";
import { TransactionEvent as TransactionEventV1 } from "forta-agent";

import { provideHandleTransaction } from "./agent";

import { TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools/lib";
import { txEventV1ToV2Converter } from "./txn.v1.to.v2.converter"

const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

const testContract = createAddress("0x1234");

const mockCalculateAlertRate = jest.fn();
jest.mock("bot-alert-rate", () => ({
  ...jest.requireActual("bot-alert-rate"),
  __esModule: true,
  default: () => mockCalculateAlertRate(),
}));

mockCalculateAlertRate.mockResolvedValue("0.1");

describe("trasnferred ownership agent", () => {
  let handleTransaction: HandleTransaction;
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  beforeAll(() => {
    handleTransaction = provideHandleTransaction();
  });

  describe("handleTransaction", () => {
    it("Returns empty findings if there is no event", async () => {
      const txEventV1: TransactionEventV1 = new TestTransactionEvent();
      const txEventV2: TransactionEventV2 = txEventV1ToV2Converter(txEventV1);

      const findings = await handleTransaction(txEventV2, mockProvider as any);
      expect(findings).toStrictEqual([]);
    });

//     it("Returns empty findings if there is random event from a non zero address", async () => {
//       const randomEvent = "event RandomEvent(address indexed previousOwner, address indexed newOwner)";

//       const txEvent = new TestTransactionEvent().addEventLog(randomEvent, testContract, [
//         createAddress("0x1"),
//         createAddress("0x2"),
//       ]);

//       const findings = await handleTransaction(txEvent);
//       expect(findings).toStrictEqual([]);
//     });

//     it("Returns empty findings if there is ownership transfer event from a zero address", async () => {
//       const txEvent = new TestTransactionEvent().addEventLog(OWNERSHIP_TRANSFERRED_ABI, testContract, [
//         createAddress("0x0"),
//         createAddress("0x2"),
//       ]);

//       const findings = await handleTransaction(txEvent);
//       expect(findings).toStrictEqual([]);
//     });

//     it("Returns findings if there is ownership transfer event from a non zero address", async () => {
//       const txEvent = new TestTransactionEvent().addEventLog(OWNERSHIP_TRANSFERRED_ABI, testContract, [
//         createAddress("0x1"),
//         createAddress("0x2"),
//       ]);

//       const findings = await handleTransaction(txEvent);

//       const labels = [
//         Label.fromObject({
//           entity: txEvent.transaction.hash,
//           entityType: EntityType.Transaction,
//           label: "Attack",
//           confidence: 0.6,
//           remove: false,
//         }),
//         Label.fromObject({
//           entity: txEvent.from,
//           entityType: EntityType.Address,
//           label: "Attacker",
//           confidence: 0.6,
//           remove: false,
//         }),
//         Label.fromObject({
//           entity: createAddress("0x1"),
//           entityType: EntityType.Address,
//           label: "Victim",
//           confidence: 0.6,
//           remove: false,
//         }),
//         Label.fromObject({
//           entity: createAddress("0x2"),
//           entityType: EntityType.Address,
//           label: "Attacker",
//           confidence: 0.6,
//           remove: false,
//         }),
//       ];

//       expect(findings).toStrictEqual([
//         Finding.fromObject({
//           name: "Ownership Transfer Detection",
//           description: "The ownership transfer is detected.",
//           alertId: "NETHFORTA-4",
//           severity: FindingSeverity.High,
//           type: FindingType.Suspicious,
//           metadata: {
//             from: createAddress("0x1"),
//             to: createAddress("0x2"),
//             anomalyScore: "0.1",
//           },
//           addresses: [createAddress("0x0"), createAddress("0x1"), createAddress("0x2")],
//           labels,
//         }),
//       ]);
//     });
  });
});
