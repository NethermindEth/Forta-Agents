import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
  // scanBase,
  scanEthereum,
  scanPolygon,
  scanOptimism,
  scanArbitrum,
  getChainId,
  runHealthCheck,
  ethers,
  Initialize,
} from "forta-bot";

import calculateAlertRate, { ScanCountType } from "bot-alert-rate";

import { getSecrets } from "./storage";

// const BOT_ID = "0x7704a975c97ed444c0329cade1f85af74566d30fb6a51550529b19153a0781cb";
// Beta
const BOT_ID = "0x50d84a3cd8ca2336ffc231b666f5c1df5ae94ad6b1674a3b2d7834c3015c2de8";

let chainId: string;
let apiKeys: any;
let isRelevantChain: boolean;
let txCount = 0;

export const provideInitialize = (): Initialize => {
  return async () => {
    apiKeys = await getSecrets();
    process.env["ZETTABLOCK_API_KEY"] = apiKeys.generalApiKeys.ZETTABLOCK[0];
    const chainIdNum = getChainId()!

    chainId = String(chainIdNum);

    //  Optimism, Fantom, & Avalanche not yet supported by bot-alert-rate package
    isRelevantChain = [10, 250, 43114].includes(chainIdNum);
  };
};

export const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

export const provideHandleTransaction = (): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {

    const findings: Finding[] = [];

    const logs = txEvent.filterLog(OWNERSHIP_TRANSFERRED_ABI);

    if (isRelevantChain) txCount++;

    await Promise.all(
      logs.map(async (log) => {
        if (ethers.ZeroAddress != log.args.previousOwner) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NETHFORTA-4",
            isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TxCount,
            txCount
          );

          findings.push(
            Finding.fromObject({
              name: "Ownership Transfer Detection",
              description: "The ownership transfer is detected.",
              alertId: "NETHFORTA-4",
              severity: FindingSeverity.High,
              type: FindingType.Suspicious,
              metadata: {
                from: log.args.previousOwner,
                to: log.args.newOwner,
                anomalyScore: anomalyScore.toString(),
              },
              addresses: [
                ...new Set([
                  txEvent.from,
                  txEvent.to,
                  log.args.previousOwner.toLowerCase(),
                  log.args.newOwner.toLowerCase(),
                ]),
              ],
              labels: [
                Label.fromObject({
                  entity: txEvent.transaction.hash,
                  entityType: EntityType.Transaction,
                  label: "Attack",
                  confidence: 0.6,
                  remove: false,
                }),
                Label.fromObject({
                  entity: txEvent.from,
                  entityType: EntityType.Address,
                  label: "Attacker",
                  confidence: 0.6,
                  remove: false,
                }),
                Label.fromObject({
                  entity: log.args.previousOwner,
                  entityType: EntityType.Address,
                  label: "Victim",
                  confidence: 0.6,
                  remove: false,
                }),
                Label.fromObject({
                  entity: log.args.newOwner,
                  entityType: EntityType.Address,
                  label: "Attacker",
                  confidence: 0.6,
                  remove: false,
                }),
              ],
              source: {
                chains: [{ chainId: txEvent.network }],
                transactions: [{ chainId: txEvent.network, hash: txEvent.hash }],
              },
            })
          );
        }
      })
    );

    return findings;
  };
};

async function main() {
  const initialize = provideInitialize();
  const handleTransaction = provideHandleTransaction();

  await initialize();

  scanEthereum({
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2",
    rpcKeyId: "e698634d-79c2-44fe-adf8-f7dac20dd33c",
    localRpcUrl: "1",
    handleTransaction,
  });

  scanOptimism({
    rpcUrl: "https://opt-mainnet.g.alchemy.com/v2",
    rpcKeyId: "5143945b-1e97-46d6-8b29-14125afcc810",
    localRpcUrl: "10",
    handleTransaction,
  });

  scanPolygon({
    rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2",
    rpcKeyId: "b9017deb-b785-48f8-bfb3-771f31190845",
    localRpcUrl: "137",
    handleTransaction,
  });

  // Note: `bot-alert-rate` doesn't properly handle it.
  // It correctly handles chains it doesn't support,
  // but not Base.
  // Errors out here: https://github.com/forta-network/bot-alert-rate/blob/main/typescript/src/helpers/calculate_alert_rate.ts#L113-L115
  // scanBase({
  //   rpcUrl: "https://base-mainnet.g.alchemy.com/v2",
  //   rpcKeyId: "1d3097d9-6e44-4ca7-a61b-2209a85d262f",
  //   localRpcUrl: "8453",
  //   handleTransaction,
  // });

  scanArbitrum({
    rpcUrl: "https://arb-mainnet.g.alchemy.com/v2",
    rpcKeyId: "c59959d5-3ab6-4fea-afc5-495f4571cf02",
    localRpcUrl: "42161",
    handleTransaction,
  });

  runHealthCheck();
}

if (require.main === module) {
  main();
}