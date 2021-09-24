import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideBigQueuedPriceDeviationHandler from "./big.queued.price.deviation";
import { TestTransactionEvent } from "@nethermindeth/general-agents-module"; 


const CONTRACT_ADDRESSES = [
    "",
];

describe("Big deviation queued price Tests", () => {
    let handleTransaction: HandleTransaction;

    it("should return empty findings if there are not traces", async () => {
        handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES);

        const txEvent: TransactionEvent = new TestTransactionEvent();

        const findings: Finding[] = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([]);
    });
});