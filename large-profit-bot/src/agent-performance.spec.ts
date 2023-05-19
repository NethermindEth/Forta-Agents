import { getEthersProvider, createTransactionEvent } from "forta-agent";
import { provideHandleTransaction } from "./agent";

import Fetcher from "./fetcher";
import { keys } from "./keys";

jest.setTimeout(200000);

describe("Large Profit Bot test suite", () => {
  it("tests performance", async () => {
    const realProvider = getEthersProvider();
    const handleRealTransaction = provideHandleTransaction(new Fetcher(realProvider, keys), realProvider);
    const largeProfitNoFindingTxReceipt = await realProvider.getTransactionReceipt(
      "0x566d2409168739da54674b08e6e13e52d440aa8e55a2edbf00bbe7e73ea85f26"
    );

    const largeProfitNoFindingTx = await realProvider.getTransaction(
      "0x566d2409168739da54674b08e6e13e52d440aa8e55a2edbf00bbe7e73ea85f26"
    );

    // Lowercase all addresses in logs to match the real txEvent logs
    const lowerCaseLogs = largeProfitNoFindingTxReceipt.logs.map((log) => {
      return {
        ...log,
        address: log.address.toLowerCase(),
      };
    });

    const largeProfitNoFindingTxEvent = createTransactionEvent({
      transaction: {
        hash: largeProfitNoFindingTxReceipt.transactionHash,
        from: largeProfitNoFindingTxReceipt.from.toLowerCase(),
        to: largeProfitNoFindingTxReceipt.to.toLowerCase(),
        nonce: largeProfitNoFindingTx.nonce,
        data: largeProfitNoFindingTx.data,
        gas: "1",
        gasPrice: largeProfitNoFindingTx.gasPrice!.toString(),
        value: "0x0",
        r: largeProfitNoFindingTx.r!,
        s: largeProfitNoFindingTx.s!,
        v: largeProfitNoFindingTx.v!.toFixed(),
      },
      block: {
        number: largeProfitNoFindingTxReceipt.blockNumber,
        hash: largeProfitNoFindingTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: lowerCaseLogs,
      contractAddress: null,
    });

    const largeProfitFindingTxReceipt = await realProvider.getTransactionReceipt(
      "0x00fa9c66b5c6945466a62c7683616259c0fa3dee1499670f502c63b18423c519"
    );

    const largeProfitFindingTx = await realProvider.getTransaction(
      "0x00fa9c66b5c6945466a62c7683616259c0fa3dee1499670f502c63b18423c519"
    );

    // Lowercase all addresses in logs to match the real txEvent logs
    const lowerCaseLogsLargeProfit = largeProfitFindingTxReceipt.logs.map((log) => {
      return {
        ...log,
        address: log.address.toLowerCase(),
      };
    });

    const largeProfitFindingTxEvent = createTransactionEvent({
      transaction: {
        hash: largeProfitFindingTxReceipt.transactionHash,
        from: largeProfitFindingTxReceipt.from.toLowerCase(),
        to: largeProfitFindingTxReceipt.to.toLowerCase(),
        nonce: largeProfitFindingTx.nonce,
        data: largeProfitFindingTx.data,
        gas: "1",
        gasPrice: largeProfitFindingTx.gasPrice!.toString(),
        value: "0x0",
        r: largeProfitFindingTx.r!,
        s: largeProfitFindingTx.s!,
        v: largeProfitFindingTx.v!.toFixed(),
      },
      block: {
        number: largeProfitFindingTxReceipt.blockNumber,
        hash: largeProfitFindingTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: lowerCaseLogsLargeProfit,
      contractAddress: null,
    });

    const normalTxReceipt = await realProvider.getTransactionReceipt(
      "0x8b1e4df9d20417ac564fc346162e13a658c1f729e7b28a4bcea732d217c436be"
    );

    const normalTx = await realProvider.getTransaction(
      "0x8b1e4df9d20417ac564fc346162e13a658c1f729e7b28a4bcea732d217c436be"
    );

    // Lowercase all addresses in logs to match the real txEvent logs
    const lowerCaseLogsNormal = normalTxReceipt.logs.map((log) => {
      return {
        ...log,
        address: log.address.toLowerCase(),
      };
    });

    const normalTxEvent = createTransactionEvent({
      transaction: {
        hash: normalTxReceipt.transactionHash,
        from: normalTxReceipt.from.toLowerCase(),
        to: normalTxReceipt.to.toLowerCase(),
        nonce: normalTx.nonce,
        data: normalTx.data,
        gas: "1",
        gasPrice: normalTx.gasPrice!.toString(),
        value: "0x0",
        r: normalTx.r!,
        s: normalTx.s!,
        v: normalTx.v!.toFixed(),
      },
      block: {
        number: normalTxReceipt.blockNumber,
        hash: normalTxReceipt.blockHash,
        timestamp: 43534534,
      },
      logs: lowerCaseLogsNormal,
      contractAddress: null,
    });

    //     Chain: Blocktime, Number of Tx -> Avg processing time in ms target
    //     Ethereum: 12s, 150 -> 80ms
    //     BSC: 3s, 70 -> 43ms
    //     Polygon: 2s, 50 -> 40ms
    //     Avalanche: 2s, 5 -> 400ms
    //     Arbitrum: 1s, 5 -> 200ms
    //     Optimism: 24s, 150 -> 160ms
    //     Fantom: 1s, 5 -> 200ms

    //      local testing reveals an avg processing time of 350, which results in the following sharding config:
    //      Ethereum: 12s, 150 -> 80ms - 5
    //      BSC: 3s, 70 -> 43ms - 9
    //      Polygon: 2s, 50 -> 40ms - 9
    //      Avalanche: 2s, 5 -> 400ms - 1
    //      Arbitrum: 1s, 5 -> 200ms - 2
    //      Optimism: 24s, 150 -> 160ms - 3
    //      Fantom: 1s, 5 -> 200ms - 2

    const processingRuns = 15;
    let totalTimeLargeProfitNoFinding = 0;
    let totalTimeLargeProfitFinding = 0;
    let totalTimeNormalTx = 0;
    for (let i = 0; i < processingRuns; i++) {
      const startTimeLargeProfitNoFinding = performance.now();
      await handleRealTransaction(largeProfitNoFindingTxEvent);
      const endTimeLargeProfitNoFinding = performance.now();
      totalTimeLargeProfitNoFinding += endTimeLargeProfitNoFinding - startTimeLargeProfitNoFinding;

      const startTimeLargeProfitFinding = performance.now();
      await handleRealTransaction(largeProfitFindingTxEvent);
      const endTimeLargeProfitFinding = performance.now();
      totalTimeLargeProfitFinding += endTimeLargeProfitFinding - startTimeLargeProfitFinding;

      const startTimeNormalTx = performance.now();
      await handleRealTransaction(normalTxEvent);
      const endTimeNormalTx = performance.now();
      totalTimeNormalTx += endTimeNormalTx - startTimeNormalTx;
    }
    const processingTimeLargeProfitNoFinding = totalTimeLargeProfitNoFinding / processingRuns;
    const processingTimeLargeProfitFinding = totalTimeLargeProfitFinding / processingRuns;
    const processingTimeNormalTx = totalTimeNormalTx / processingRuns;
    console.log(
      (processingTimeLargeProfitNoFinding * 0.2 +
        processingTimeLargeProfitFinding * 0.01 +
        processingTimeNormalTx * 0.79) /
        3
    );
    expect(
      (processingTimeLargeProfitNoFinding * 0.2 +
        processingTimeLargeProfitFinding * 0.01 +
        processingTimeNormalTx * 0.79) /
        3
    ).toBeLessThan(350);
  });
});
