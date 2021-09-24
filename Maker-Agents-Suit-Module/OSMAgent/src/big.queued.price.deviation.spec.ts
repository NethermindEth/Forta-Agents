import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideBigQueuedPriceDeviationHandler, { createFinding } from "./big.queued.price.deviation";
import { TestTransactionEvent, createAddress } from "@nethermindeth/general-agents-module"; 
import Web3 from "web3";


const CONTRACT_ADDRESSES = [
    createAddress("0x1"),
    createAddress("0x2"),
    createAddress("0x3"),
    createAddress("0x4"),
];

const PEEK_FUNCTION_SELECTOR = "0x59e02dd7";

const web3: Web3 = new Web3();

describe("Big deviation queued price Tests", () => {
    let handleTransaction: HandleTransaction;

    it("should return empty findings if there are not traces", async () => {
        handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES);

        const txEvent: TransactionEvent = new TestTransactionEvent();

        const findings: Finding[] = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([]);
    });

    it("should return a finding when the new price deviate too much", async () => {
        handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES);

        const txEvent: TransactionEvent = new TestTransactionEvent().addTrace({
            from: CONTRACT_ADDRESSES[0],
            input: PEEK_FUNCTION_SELECTOR,
            output: web3.eth.abi.encodeParameters(["uint128", "bool"], [107, true]),
        }).addEventLog("LogValue(bytes32)", CONTRACT_ADDRESSES[0], [], web3.eth.abi.encodeParameter("uint128", 100));

        const findings: Finding[] = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([createFinding(CONTRACT_ADDRESSES[0])]);
    });

    it("should return empty findings if the new price doesn't deviate too much", async () => {
        handleTransaction = provideBigQueuedPriceDeviationHandler(CONTRACT_ADDRESSES);

        const txEvent: TransactionEvent = new TestTransactionEvent().addTrace({
            from: CONTRACT_ADDRESSES[0],
            input: PEEK_FUNCTION_SELECTOR,
            output: web3.eth.abi.encodeParameters(["uint128", "bool"], [105, true]),
        }).addEventLog("LogValue(bytes32)", CONTRACT_ADDRESSES[0], [], web3.eth.abi.encodeParameter("uint128", 100));

        const findings: Finding[] = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([]);
    });
});