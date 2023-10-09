import {
  BlockEvent,
  Finding,
  Initialize,
  HandleBlock,
  HandleAlert,
  AlertEvent,
  getEthersProvider,
  getAlerts,
} from "forta-agent";
import { providers } from "ethers";
import { cleanObject, getBlocksInTimePeriodForChainId, getChainBlockTime } from "./utils/utils";
import { ScammerInfo, VictimInfo, ApiKeys } from "./types";
import { getSecrets, load, persist } from "./storage";
import DataFetcher from "./fetcher";
import { processFraudulentNftOrders } from "./fraud.nft.order.processing";
import {
  SCAM_DETECTOR_BOT_ID,
  SCAM_DETECTOR_ALERT_IDS,
  ONE_DAY_IN_SECS,
  TWENTY_FIVE_DAYS_IN_SECS,
  THIRTY_DAYS_IN_SECS,
  NINETY_DAYS,
  MAX_OBJECT_SIZE,
  SCAMMERS_DB_KEY,
  VICTIMS_DB_KEY,
  NETHERMIND_ICE_PHISHING_BOT,
  BLOCKSEC_ICE_PHISHING_BOT,
  ICE_PHISHING_ALERT_IDS,
  DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS,
} from "./constants";
import { extractScammerAddresses, processIcePhishingTransfers } from "./ice.phishing.processing";

let chainId: number;
let dataFetcher: DataFetcher;
let lastPersistenceMinute: number;

let scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};
let victimsScammed: { [key: string]: VictimInfo } = {};

const findingsCache: Finding[] = [];
const scammersInvolvedInMultipleScamTypes: string[] = [];

async function createNewDataFetcher(provider: providers.Provider): Promise<DataFetcher> {
  const apiKeys = (await getSecrets()) as ApiKeys;
  return new DataFetcher(provider, apiKeys);
}

export function provideInitialize(
  provider: providers.Provider,
  dataFetcherCreator: (provider: providers.Provider) => Promise<DataFetcher>,
  loadObject: (key: string) => Promise<any>
): Initialize {
  return async () => {
    chainId = (await provider.getNetwork()).chainId;
    dataFetcher = await dataFetcherCreator(provider);

    const victimsKey = VICTIMS_DB_KEY + "-" + chainId;
    const scammersKey = SCAMMERS_DB_KEY + "-" + chainId;

    victimsScammed = await loadObject(victimsKey);
    scammersCurrentlyMonitored = await loadObject(scammersKey);

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
    const blocksInTwentyFiveDays = getBlocksInTimePeriodForChainId(TWENTY_FIVE_DAYS_IN_SECS, chainId);
    const scammerAddress = alertEvent.alert.metadata["scammerAddresses"];

    switch (alertEvent.alertId!) {
      case "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER":
        if (!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
          scammersCurrentlyMonitored[scammerAddress] = {
            firstAlertIdAppearance: alertEvent.alertId!,
            // Default to twenty five days ago in case Zettablock
            // doesn't return as expected. Value to be overwritten
            // downstream in the logic if returned values are usable.
            // Twenty five specifically because the block handler
            // removes scammers that haven't been active in thirty days,
            // and this gives a couple of days to find transfers for the scammer.
            mostRecentActivityByBlockNumber: alertEvent.blockNumber! - blocksInTwentyFiveDays,
            totalUsdValueStolen: 0,
          };
          findingsCache.push(
            ...(await processFraudulentNftOrders(
              scammerAddress,
              NINETY_DAYS,
              dataFetcher,
              scammersCurrentlyMonitored,
              victimsScammed,
              chainId,
              alertEvent.blockNumber!
            ))
          );
        } else if (
          // Tentative logic to keep track of scammers involved in multiple scam types
          scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance !== alertEvent.alertId! &&
          !scammersInvolvedInMultipleScamTypes.includes(scammerAddress)
        ) {
          scammersInvolvedInMultipleScamTypes.push(scammerAddress);
          console.log(`Scammer ${scammerAddress} has been involved in multiple scam types`);
        }
        break;

      case "SCAM-DETECTOR-ICE-PHISHING":
        const sourceAlertBotId = alertEvent.alert.source?.sourceAlert?.botId;
        const sourceAlertHash = alertEvent.alert.source?.sourceAlert?.hash;
        const underlyingAlert = sourceAlertHash
          ? (
              await getAlerts({
                alertHash: sourceAlertHash,
                blockNumberRange: {
                  // Requires blockNumberRange to be set to fetch the alert successfully
                  startBlockNumber: DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.START,
                  endBlockNumber: alertEvent.blockNumber
                    ? alertEvent.blockNumber
                    : DEFAULT_FORTA_API_QUERY_BLOCK_NUMBERS.END,
                },
              })
            ).alerts[0]
          : undefined;

        if (!underlyingAlert) break;

        const { alertId: underlyingAlertID, metadata, description } = underlyingAlert;

        if (!ICE_PHISHING_ALERT_IDS.includes(underlyingAlertID!)) break;

        const scammerAddresses: string[] = [];

        if (sourceAlertBotId === NETHERMIND_ICE_PHISHING_BOT) {
          if (underlyingAlertID !== "ICE-PHISHING-HIGH-NUM-APPROVED-TRANSFERS") {
            scammerAddresses.push(scammerAddress);
          } else {
            const underlyingAlertFirstTxHash = metadata["firstTxHash"];
            const underlyingAlertLastTxHash = metadata["lastTxHash"];
            const [firstTxReceipt, lastTxReceipt] = await Promise.all([
              dataFetcher.getTransactionReceipt(underlyingAlertFirstTxHash),
              dataFetcher.getTransactionReceipt(underlyingAlertLastTxHash),
            ]);

            extractScammerAddresses(firstTxReceipt!, scammerAddresses);
            extractScammerAddresses(lastTxReceipt!, scammerAddresses);
          }
        } else if (sourceAlertBotId === BLOCKSEC_ICE_PHISHING_BOT && !description!.includes("approve")) {
          // Checking if scammer address exists as there exist alerts about phishing urls and not EOAs, where the property is empty.
          if (scammerAddress) scammerAddresses.push(scammerAddress);
        }

        const uniqueScammerAddresses = [...new Set(scammerAddresses)];
        for (const scammerAddress of uniqueScammerAddresses) {
          if (!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
            scammersCurrentlyMonitored[scammerAddress] = {
              firstAlertIdAppearance: alertEvent.alertId!,
              mostRecentActivityByBlockNumber: alertEvent.blockNumber! - blocksInTwentyFiveDays,
              totalUsdValueStolen: 0,
            };

            findingsCache.push(
              ...(await processIcePhishingTransfers(
                scammerAddress,
                NINETY_DAYS,
                dataFetcher,
                scammersCurrentlyMonitored,
                victimsScammed,
                chainId,
                alertEvent.blockNumber!
              ))
            );
          } else if (
            // Tentative logic to keep track of scammers involved in multiple scam types
            scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance !== alertEvent.alertId! &&
            !scammersInvolvedInMultipleScamTypes.includes(scammerAddress)
          ) {
            scammersInvolvedInMultipleScamTypes.push(scammerAddress);
            console.log(`Scammer ${scammerAddress} has been involved in multiple scam types`);
          }

          break;
        }
    }
    return findingsCache.splice(0, 15);
  };
}

export function provideHandleBlock(): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    // Tentative logic to keep track of scammers involved in multiple scam types
    if (blockEvent.blockNumber % 100 === 0 && scammersInvolvedInMultipleScamTypes.length > 0) {
      console.log("Scammers involved in multiple scam types: ", scammersInvolvedInMultipleScamTypes);
    }

    const blocksInOneDay = getBlocksInTimePeriodForChainId(ONE_DAY_IN_SECS, chainId);

    if (blockEvent.blockNumber % blocksInOneDay === 0) {
      for (const scammerAddress of Object.keys(scammersCurrentlyMonitored)) {
        const blocksSinceScammerLastActive =
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber;

        const scammerLastActiveInSecs = blocksSinceScammerLastActive * getChainBlockTime(chainId);
        const daysSinceScammerLastActive = Math.ceil(scammerLastActiveInSecs / ONE_DAY_IN_SECS);

        switch (scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance) {
          case "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER":
            const fraudulentNftOrderFindings = await processFraudulentNftOrders(
              scammerAddress,
              daysSinceScammerLastActive,
              dataFetcher,
              scammersCurrentlyMonitored,
              victimsScammed,
              chainId,
              blockEvent.blockNumber
            );
            findingsCache.push(...fraudulentNftOrderFindings);
            break;
          case "SCAM-DETECTOR-ICE-PHISHING":
            const icePhishingFindings = await processIcePhishingTransfers(
              scammerAddress,
              daysSinceScammerLastActive,
              dataFetcher,
              scammersCurrentlyMonitored,
              victimsScammed,
              chainId,
              blockEvent.blockNumber
            );
            findingsCache.push(...icePhishingFindings);
            break;
        }

        const blocksInThirtyDays = getBlocksInTimePeriodForChainId(THIRTY_DAYS_IN_SECS, chainId);
        if (
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber >
          blocksInThirtyDays
        ) {
          console.log("Deleting inactive scammer from scammersCurrentlyMonitored object: ", scammerAddress);
          delete scammersCurrentlyMonitored[scammerAddress];
        }
      }
    }

    const date = new Date();
    const minutes = date.getMinutes();

    if (minutes % 10 === 0 && lastPersistenceMinute !== minutes) {
      let scammersObjectSize = Buffer.from(JSON.stringify(scammersCurrentlyMonitored)).length;
      let victimsObjectSize = Buffer.from(JSON.stringify(victimsScammed)).length;
      console.log(
        `Scammers Monitored Object Size: ${scammersObjectSize} | Victims Scammed Object Size: ${victimsObjectSize}`
      );

      let largerObjectSize = scammersObjectSize < victimsObjectSize ? victimsObjectSize : scammersObjectSize;

      while (largerObjectSize > MAX_OBJECT_SIZE) {
        console.log("Cleaning Scammers Monitored Object of size: ", scammersObjectSize);
        cleanObject(scammersCurrentlyMonitored);
        scammersObjectSize = Buffer.from(JSON.stringify(scammersCurrentlyMonitored)).length;
        console.log("Scammers Monitored Object after cleaning: ", scammersObjectSize);

        console.log("Cleaning Victims Scammed Object of size: ", victimsObjectSize);
        cleanObject(victimsScammed);
        victimsObjectSize = Buffer.from(JSON.stringify(victimsScammed)).length;
        console.log("Victims Scammed Object after cleaning: ", victimsObjectSize);

        largerObjectSize = scammersObjectSize < victimsObjectSize ? victimsObjectSize : scammersObjectSize;
      }

      await persist(scammersCurrentlyMonitored, SCAMMERS_DB_KEY);
      await persist(victimsScammed, VICTIMS_DB_KEY);
      lastPersistenceMinute = minutes;
    }

    return findingsCache.splice(0, 15);
  };
}

export default {
  initialize: provideInitialize(getEthersProvider(), createNewDataFetcher, load),
  handleAlert: provideHandleAlert(),
  handleBlock: provideHandleBlock(),
  provideInitialize,
  provideHandleAlert,
  provideHandleBlock,
};
