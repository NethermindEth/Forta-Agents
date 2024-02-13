import { TransactionEvent as TransactionEventV1, Log as LogV1 } from "forta-agent";
import { TransactionEvent as TransactionEventV2, createTransactionEvent, Log as LogV2 } from "forta-bot";

// NOTE: `forta-bot` does not export this type
type JsonRpcLog = Omit<LogV2, "logIndex" | "blockNumber" | "transactionIndex"> & {
    logIndex: string;
    blockNumber: string;
    transactionIndex: string;
};

// TransactionEventV1 to TransactionEventV2 Converter
export function txEventV1ToV2Converter(txEventV1: TransactionEventV1): TransactionEventV2 {
    const jsonRpcTransaction = {
        hash: txEventV1.hash,
        from: txEventV1.from,
        to: txEventV1.to,
        nonce: txEventV1.transaction.nonce.toString(),
        gas: txEventV1.transaction.gas,
        gasPrice: txEventV1.transaction.gasPrice,
        value: txEventV1.transaction.value,
        input: txEventV1.transaction.data,
        r: txEventV1.transaction.r,
        s: txEventV1.transaction.s,
        v: txEventV1.transaction.v
    };

    const jsonRpcBlock = {
        difficulty: "",
        extraData: "",
        gasLimit: "",
        gasUsed: "",
        hash: txEventV1.block.hash,
        logsBloom: "",
        miner: "",
        mixHash: "",
        nonce: "",
        number: txEventV1.block.hash,
        parentHash: "",
        receiptsRoot: "",
        sha3Uncles: "",
        size: "",
        stateRoot: "",
        timestamp: txEventV1.block.timestamp.toString(),
        totalDifficulty: "",
        transactions: [jsonRpcTransaction],
        transactionsRoot: "",
        uncles: [""],
    };

    const logsV2: JsonRpcLog[] = []
    txEventV1.logs.map((log: LogV1) => {
        logsV2.push({
            address: log.address,
            topics: log.topics,
            data: log.data,
            logIndex: log.logIndex.toString(),
            blockNumber: log.blockNumber.toString(),
            blockHash: log.blockHash,
            transactionIndex: log.transactionIndex.toString(),
            transactionHash: log.transactionHash,
            removed: log.removed,
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