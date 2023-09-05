import { BlockEvent, Finding, Initialize, HandleBlock, HandleAlert, AlertEvent, getEthersProvider } from "forta-agent";
import { providers, utils } from "ethers";
import { cleanObject, getBlocksInTimePeriodForChainId, getChainBlockTime } from "./utils/utils";
import { ScammerInfo, Erc721Transfer, apiKeys } from "./types";
import { createFraudNftOrderFinding } from "./utils/findings";
import { getSecrets, load, persist } from "./storage";
import DataFetcher from "./fetcher";
import {
  SCAM_DETECTOR_BOT_ID,
  SCAM_DETECTOR_ALERT_IDS,
  NINETY_DAYS,
  EXCHANGE_CONTRACT_ADDRESSES,
  FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD,
  THIRTY_DAYS_IN_MS,
  ONE_DAY_IN_MS,
  MAX_OBJECT_SIZE,
} from "./constants";

let chainId: number;
let apiKeys: apiKeys;
let dataFetcher: DataFetcher;
let lastPersistenceMinute: number;

const dbKey = "nm-victim-loss-identifier-objects";

let scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};

async function createNewDataFetcher(provider: providers.Provider): Promise<DataFetcher> {
  const apiKeys = (await getSecrets()) as apiKeys;
  return new DataFetcher(provider, apiKeys);
}

async function processFraudulentNftOrders(
  scammerAddress: string,
  erc721TransferTimeWindow: number,
  dataFetcher: DataFetcher
): Promise<Finding[]> {
  const findings: Finding[] = [];

  const scammerErc721Transfers: Erc721Transfer[] = await dataFetcher.getScammerErc721Transfers(
    scammerAddress,
    erc721TransferTimeWindow
  );

  for (const erc721Transfer of scammerErc721Transfers) {
    const {
      transaction_hash: exploitTxnHash,
      contract_address: stolenTokenAddress,
      name: stolenTokenName,
      symbol: stolenTokenSymbol,
      token_id: stolenTokenId,
    }: Erc721Transfer = erc721Transfer;
    const txnReceipt = await dataFetcher.getTransactionReceipt(exploitTxnHash);
    const txnLogs = txnReceipt!.logs;

    const victimAddress = utils.hexDataSlice(
      txnLogs.find((log) => {
        return (
          log.address.toLowerCase() === stolenTokenAddress &&
          log.topics[0] === utils.id("Transfer(address,address,uint256)") &&
          Number(log.topics[3]) === Number(stolenTokenId)
        );
      })!.topics[1],
      12
    );

    // Covers two FP cases:
    // 1) Buyer paying in WETH/stablecoin instead of ETH
    // 2) Transaction being a regular NFT trade
    const hasBuyerTransferredToSeller = txnLogs.some((log) => {
      return (
        log.topics[0] === utils.id("Transfer(address,address,uint256)") &&
        log.topics[1].includes(scammerAddress.slice(2)) &&
        log.topics[2].includes(victimAddress.slice(2))
      );
    });

    // TODO: Add FP mitigation alert if the transaction is the one that generated the source alert
    if (hasBuyerTransferredToSeller) continue;

    if (
      // Skip over this transfer if this tokenId
      // transfer in this transaction for this
      // victim has already been accounted for
      scammersCurrentlyMonitored[scammerAddress].victims?.[victimAddress]?.transactions?.[exploitTxnHash]?.erc721?.[
        stolenTokenAddress
      ]?.tokenIds?.includes(Number(stolenTokenId))
    ) {
      continue;
    }

    const txnResponse = await dataFetcher.getTransaction(exploitTxnHash);
    if (
      txnResponse!.to != null &&
      Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse!.to) &&
      txnResponse!.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD)
    ) {
      const nftCollectionFloorPrice = await dataFetcher.getNftCollectionFloorPrice(
        stolenTokenAddress,
        txnResponse!.blockNumber!
      );

      if (scammersCurrentlyMonitored[scammerAddress].victims === undefined) {
        // The scammer has no victims yet,
        // so add as a new victim
        scammersCurrentlyMonitored[scammerAddress].victims = {
          [victimAddress]: {
            totalUsdValueAcrossAllTokens: 0,
            totalUsdValueAcrossAllErc721Tokens: 0,
            transactions: {
              [exploitTxnHash]: {
                erc721: {
                  [stolenTokenAddress]: {
                    tokenName: stolenTokenName,
                    tokenSymbol: stolenTokenSymbol,
                    tokenIds: [],
                    tokenTotalUsdValue: 0,
                  },
                },
              },
            },
          },
        };
      } else if (scammersCurrentlyMonitored[scammerAddress].victims![victimAddress] === undefined) {
        // The scammer doesn't have _this_ specific victim yet,
        // so add as a new entry
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress] = {
          totalUsdValueAcrossAllTokens: 0,
          totalUsdValueAcrossAllErc721Tokens: 0,
          transactions: {
            [exploitTxnHash]: {
              erc721: {
                [stolenTokenAddress]: {
                  tokenName: stolenTokenName,
                  tokenSymbol: stolenTokenSymbol,
                  tokenIds: [],
                  tokenTotalUsdValue: 0,
                },
              },
            },
          },
        };
      } else {
        // This specific scammer victim doesn't have this specific transaction,
        // so add as new entry
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash] = {
          erc721: {
            [stolenTokenAddress]: {
              tokenName: stolenTokenName,
              tokenSymbol: stolenTokenSymbol,
              tokenIds: [],
              tokenTotalUsdValue: 0,
            },
          },
        };
      }

      scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].totalUsdValueAcrossAllTokens! +=
        nftCollectionFloorPrice;
      scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].totalUsdValueAcrossAllErc721Tokens! +=
        nftCollectionFloorPrice;
      scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
        stolenTokenAddress
      ].tokenTotalUsdValue! += nftCollectionFloorPrice;
      scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
        stolenTokenAddress
      ].tokenIds!.push(Number(stolenTokenId));

      findings.push(
        createFraudNftOrderFinding(
          victimAddress,
          scammerAddress,
          scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance,
          scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].totalUsdValueAcrossAllTokens!,
          stolenTokenName,
          stolenTokenAddress,
          stolenTokenId,
          scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].totalUsdValueAcrossAllErc721Tokens!,
          exploitTxnHash,
          nftCollectionFloorPrice,
          erc721TransferTimeWindow
        )
      );
    }
  }

  return findings;
}

export function provideInitialize(
  provider: providers.Provider,
  dataFetcherCreator: (provider: providers.Provider) => Promise<DataFetcher>
): Initialize {
  return async () => {
    chainId = (await provider.getNetwork()).chainId;
    dataFetcher = await dataFetcherCreator(provider);
    scammersCurrentlyMonitored = await load(dbKey);

    return {
      alertConfig: {
        subscriptions: [
          {
            botId: SCAM_DETECTOR_BOT_ID,
            alertIds: SCAM_DETECTOR_ALERT_IDS,
            chainId,
          },
        ],
      },
    };
  };
}

export function provideHandleAlert(): HandleAlert {
  return async (alertEvent: AlertEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const scammerAddress = alertEvent.alert.metadata["scammerAddresses"];
    if (!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
      scammersCurrentlyMonitored[scammerAddress] = {
        firstAlertIdAppearance: alertEvent.alertId!,
        mostRecentActivityByBlockNumber: alertEvent.blockNumber!,
      };

      switch (alertEvent.alertId!) {
        case "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER":
          findings.push(...(await processFraudulentNftOrders(scammerAddress, NINETY_DAYS, dataFetcher)));
          break;

        default:
          return findings;
      }
    }

    return findings;
  };
}

export function provideHandleBlock(): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const blocksInOneDay = getBlocksInTimePeriodForChainId(ONE_DAY_IN_MS, chainId);

    if (blockEvent.blockNumber % blocksInOneDay === 0) {
      for (const scammerAddress of Object.keys(scammersCurrentlyMonitored)) {
        const blocksSinceScammerLastActive =
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber;

        const timePeriodInSecs = blocksSinceScammerLastActive * getChainBlockTime(chainId);
        const daysSinceScammerLastActive = Math.ceil(timePeriodInSecs / (24 * 60 * 60));

        const fraudulentNftOrderFindings = await processFraudulentNftOrders(
          scammerAddress,
          daysSinceScammerLastActive,
          dataFetcher
        );

        if (fraudulentNftOrderFindings.length > 0) {
          scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = blockEvent.blockNumber;
        }

        findings.push(...fraudulentNftOrderFindings);

        const blocksInThirtyDays = getBlocksInTimePeriodForChainId(THIRTY_DAYS_IN_MS, chainId);
        if (
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber >
          blocksInThirtyDays
        ) {
          delete scammersCurrentlyMonitored[scammerAddress];
        }
      }
    }

    const date = new Date();
    const minutes = date.getMinutes();

    if (minutes % 10 === 0 && lastPersistenceMinute !== minutes) {
      let objectSize = Buffer.from(JSON.stringify(scammersCurrentlyMonitored)).length;
      console.log("Scammers Monitored Object Size:", objectSize);

      while (objectSize > MAX_OBJECT_SIZE) {
        console.log("Cleaning Scammers Monitored Object of size: ", objectSize);
        cleanObject(scammersCurrentlyMonitored);
        objectSize = Buffer.from(JSON.stringify(scammersCurrentlyMonitored)).length;
        console.log("Scammers Monitored Object after cleaning: ", objectSize);
      }

      await persist(scammersCurrentlyMonitored, dbKey);
      lastPersistenceMinute = minutes;
    }

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider(), createNewDataFetcher),
  handleAlert: provideHandleAlert(),
  handleBlock: provideHandleBlock(),
  provideInitialize,
  provideHandleAlert,
  provideHandleBlock,
};
