import { TransactionEvent as TransactionEventV2, createTransactionEvent, JsonRpcLog } from "@fortanetwork/forta-bot";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";

export function txEventV1ToV2Converter(txEventV1: TestTransactionEvent): TransactionEventV2 {
    const { hash, from, to, transaction, block } = txEventV1;
    const { nonce, gas, gasPrice, value, data, r, s , v } = transaction;
    const jsonRpcTransaction = {
        hash,
        from,
        to,
        nonce: nonce.toString(),
        gas,
        gasPrice,
        value,
        input: data,
        r,
        s,
        v
    };

    const jsonRpcBlock = {
        difficulty: "",
        extraData: "",
        gasLimit: "",
        gasUsed: "",
        hash: block.hash,
        logsBloom: "",
        miner: "",
        mixHash: "",
        nonce: "",
        number: block.number ? block.number.toString() : "10", // `10` to have a non-zero value
        parentHash: "",
        receiptsRoot: "",
        sha3Uncles: "",
        size: "",
        stateRoot: "",
        timestamp: block.timestamp ? block.timestamp.toString() : "100", // `100` to have a non-zero value
        totalDifficulty: "",
        transactions: [jsonRpcTransaction],
        transactionsRoot: "",
        uncles: [""],
    };

    const logsV2: JsonRpcLog[] = []
    txEventV1.logs.map((log) => {
        const { address, topics, data, logIndex, blockNumber, blockHash, transactionIndex, transactionHash, removed } = log;
        logsV2.push({
            address,
            topics,
            data,
            logIndex: logIndex ? logIndex.toString() : "1000",
            blockNumber: blockNumber ? blockNumber.toString() : "10",
            blockHash,
            transactionIndex: transactionIndex ? transactionIndex.toString() : "1001",
            transactionHash,
            removed,
        })
    })

    const txEventV2: TransactionEventV2 = createTransactionEvent(
        jsonRpcTransaction,
        jsonRpcBlock,
        txEventV1.network,
        txEventV1.traces,
        logsV2
    );
    return txEventV2;
}