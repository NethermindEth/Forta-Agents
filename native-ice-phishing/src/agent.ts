import {
  Finding,
  TransactionEvent,
  Network,
  ethers,
  getEthersProvider,
  FindingSeverity,
} from "forta-agent";
import { ScanCountType } from "bot-alert-rate";
import calculateAlertRate from "bot-alert-rate";
import DataFetcher from "./fetcher";
import { createFinding } from "./findings";
import { ZETTABLOCK_API_KEY } from "./key";

let chainId: Network;
let txWithInputDataCount = 0;

export const BOT_ID =
  "0x1a69f5ec8ef436e4093f9ec4ce1a55252b7a9a2d2c386e3f950b79d164bc99e0";

export const provideInitialize = (provider: ethers.providers.Provider) => {
  return async () => {
    process.env["ZETTABLOCK_API_KEY"] = ZETTABLOCK_API_KEY;
    ({ chainId } = await provider.getNetwork());
  };
};

export const provideHandleTransaction =
  (dataFetcher: DataFetcher, calculateAlertRate: any) =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const {
      hash,
      from,
      to,
      transaction: { value, data },
    } = txEvent;

    if (to && data !== "0x") {
      //  Optimism, Fantom & Avalanche not yet supported by bot-alert-rate package
      const isRelevantChain = [10, 250, 43114].includes(Number(chainId));
      if (isRelevantChain) txWithInputDataCount++;

      if (data.length === 10 && (await dataFetcher.isEoa(to))) {
        const sig = await dataFetcher.getSignature(data);

        if (sig) {
          const [alertId, severity] =
            value !== "0x0"
              ? ["NIP-1", FindingSeverity.Medium]
              : ["NIP-2", FindingSeverity.Info];
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            alertId,
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.TxWithInputDataCount,
            txWithInputDataCount // No issue in passing 0 for non-relevant chains
          );
          findings.push(
            createFinding(hash, from, to, sig, anomalyScore, severity)
          );
        } else {
          console.log(
            `No signature found for ${data} in ${hash} from ${from} to ${to}`
          );
        }
      }
    }

    return findings;
  };

export default {
  initialize: provideInitialize(getEthersProvider()),
  provideInitialize,
  handleTransaction: provideHandleTransaction(
    new DataFetcher(getEthersProvider()),
    calculateAlertRate
  ),
};
