import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { 
  createAddress, 
  TestTransactionEvent 
} from "forta-agent-tools";
import deposit from "./deposit";
import BigNumber from "bignumber.js";
import { 
  traceData, 
  traceBadData,
  createDepositFinding as createFinding,
} from "./utils";


const cafeVault: string = createAddress("0xcafe");
const fakeVault: string = createAddress("0xdead");
const sender1: string = createAddress("0xa1");
const sender2: string = createAddress("0xa2");
const recipient: string = createAddress("0xb1");
const large: BigNumber = new BigNumber(20);


describe("Withdraw handler test suite", () => {
  const handler: HandleTransaction = deposit.provideLargeDepositDetector(fakeVault, large);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore not large withdrawals", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces(
        traceData(fakeVault, sender1, "19", recipient),
        traceData(fakeVault, sender1, "2", recipient),
        traceData(fakeVault, sender2, "10", recipient),
        traceData(fakeVault, sender2, "4", recipient),
      )

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });  

  it("should ignore deposit to other contracts", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces(
        traceData(cafeVault, sender1, "20", recipient),
        traceData(cafeVault, sender1, "21", recipient),
        traceData(recipient, sender2, "3", recipient),
        traceData(sender1, fakeVault, "40", sender2),
      )

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });  

  it("should ignore calls with wrong signature", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces(
        traceBadData(fakeVault, sender1, "20", recipient),
        traceBadData(fakeVault, sender1, "2", recipient),
        traceBadData(fakeVault, sender2, "100", recipient),
        traceBadData(fakeVault, cafeVault, "4123", sender2),
      )

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });  
  
  it("should detect large deposits", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces(
        traceData(fakeVault, sender1, "100", recipient),
        traceData(fakeVault, sender1, "20", recipient),
        traceData(fakeVault, sender2, "3123", recipient),
        traceData(fakeVault, cafeVault, "42", sender2),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(fakeVault, sender1, recipient, "100"),
      createFinding(fakeVault, sender1, recipient, "20"),
      createFinding(fakeVault, sender2, recipient, "3123"),
      createFinding(fakeVault, cafeVault, sender2, "42"),
    ]);
  }); 
});
