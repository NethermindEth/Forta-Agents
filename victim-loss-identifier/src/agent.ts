import { BlockEvent, Finding, Initialize, HandleBlock, HandleAlert, AlertEvent, getEthersProvider } from "forta-agent";
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
} from "./constants";

let chainId: number;
let dataFetcher: DataFetcher;
let lastPersistenceMinute: number;

let scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};
let victimsScammed: { [key: string]: VictimInfo } = {};

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
    victimsScammed = await loadObject(VICTIMS_DB_KEY);
    scammersCurrentlyMonitored = await loadObject(SCAMMERS_DB_KEY);

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
    const blocksInTwentyFiveDays = getBlocksInTimePeriodForChainId(TWENTY_FIVE_DAYS_IN_SECS, chainId);

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

      switch (alertEvent.alertId!) {
        case "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER":
          findings.push(
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

    const blocksInOneDay = getBlocksInTimePeriodForChainId(ONE_DAY_IN_SECS, chainId);

    if (blockEvent.blockNumber % blocksInOneDay === 0) {
      for (const scammerAddress of Object.keys(scammersCurrentlyMonitored)) {
        const blocksSinceScammerLastActive =
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber;

        const scammerLastActiveInSecs = blocksSinceScammerLastActive * getChainBlockTime(chainId);
        const daysSinceScammerLastActive = Math.ceil(scammerLastActiveInSecs / ONE_DAY_IN_SECS);

        const fraudulentNftOrderFindings = await processFraudulentNftOrders(
          scammerAddress,
          daysSinceScammerLastActive,
          dataFetcher,
          scammersCurrentlyMonitored,
          victimsScammed,
          chainId,
          blockEvent.blockNumber
        );

        findings.push(...fraudulentNftOrderFindings);

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

    return findings;
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
