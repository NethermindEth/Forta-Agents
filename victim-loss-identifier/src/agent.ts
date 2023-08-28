import { BlockEvent, Finding, Initialize, HandleBlock, HandleAlert, AlertEvent, getEthersProvider } from "forta-agent";
import { providers, BigNumber, utils } from "ethers";
import {
  SCAM_DETECTOR_BOT_ID,
  SCAM_DETECTOR_ALERT_IDS,
  ONE_DAY,
  NINETY_DAYS,
  EXCHANGE_CONTRACT_ADDRESSES,
  FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD,
  THIRTY_DAYS,
} from "./constants";
import { ScammerInfo } from "./types";
import { createFraudNftOrderFinding } from "./utils/findings";
import { getBlocksInTimePeriodForChainId, fetchApiKey } from "./utils/utils";
import { getErc721TransfersInvolvingAddress } from "./utils/transfer.fetcher";

const ethersProvider: providers.Provider = getEthersProvider();
let chainId: number;
let apiKey: string;

const scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};

// TODO: Add implementation
function getNftCollectionFloorPrice(): number {
  return 0;
}

// TODO: Add the ability to fetch the API key
// from the secrets.json

async function processFraudulentNftOrders(
  provider: providers.Provider,
  scammerAddress: string,
  erc721TransferTimeWindow: number,
  getErc721TransfersInvolvingScammer: (
    scammerAddress: string,
    transferOccuranceTimeWindow: number,
    apiKey: string
  ) => Promise<any[]>,
  fetchNftCollectionFloorPrice: () => number
): Promise<Finding[]> {
  const findings: Finding[] = [];

  // TODO: Give this an actual defined type
  const scammerErc721Transfers: any[] = await getErc721TransfersInvolvingScammer(
    scammerAddress,
    erc721TransferTimeWindow,
    apiKey
  );

  // TODO: Give this an actual defined type
  await Promise.all(
    scammerErc721Transfers.map(async (erc721Transfer: any) => {
      // TODO: Give this an actual defined type
      const {
        tx_hash: exploitTxnHash,
        from_address: victimAddress,
        contract_address: stolenTokenAddress,
        token_name: stolenTokenName,
        token_symbol: stolenTokenSymbol,
        token_id: stolenTokenId,
      } = erc721Transfer;

      // TODO: Use TransactionReceipt from `ethers`
      // to fetch the transaction logs and find
      // address that first transferred the specific
      // tokenId. As it is, we could incorrectly mark
      // a middleman address as the victim
      // Note: TransactionReceipt does not have a
      // `value` property, so we have to use both
      // TransactionResponse and TransactionReceipt

      if (
        scammersCurrentlyMonitored[scammerAddress].victims !== undefined &&
        // Skip over this transfer if this tokenId
        // transfer in this transaction for this
        // victim has already been accounted for
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
          stolenTokenAddress
        ].tokenIds!.includes(stolenTokenId)
      ) {
        // TODO: Update to "skip" over this transfer
        // in `scammerErc721Transfers`, instead of
        // returning the findings, which would conclude
        // the logic execution
        return findings;
      }

      const txnResponse = await provider.getTransaction(exploitTxnHash);
      if (
        txnResponse.to != null &&
        Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse.to) &&
        txnResponse.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD)
      ) {
        const nftCollectionFloorPrice = await fetchNftCollectionFloorPrice();

        scammersCurrentlyMonitored[scammerAddress].victims = {
          [victimAddress]: {
            totalUsdValueAcrossAllTokens: 0,
            transactions: {
              [exploitTxnHash]: {
                erc721: {
                  [stolenTokenAddress]: {
                    // TODO: Would this be an issue if it
                    // overwrites the existing name and symbol?
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

        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].totalUsdValueAcrossAllTokens! += nftCollectionFloorPrice;
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
          stolenTokenAddress
        ].tokenIds!.push(stolenTokenId);
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
          stolenTokenAddress
        ].tokenTotalUsdValue! += nftCollectionFloorPrice;

        findings.push(
          createFraudNftOrderFinding(
            victimAddress,
            scammerAddress,
            scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance,
            scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].totalUsdValueAcrossAllTokens!,
            stolenTokenName,
            stolenTokenAddress,
            stolenTokenId,
            scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
              stolenTokenAddress
            ].tokenTotalUsdValue!,
            exploitTxnHash,
            nftCollectionFloorPrice
          )
        );
      }
    })
  );

  return findings;
}

export function provideInitialize(provider: providers.Provider, apiKeyFetcher: () => Promise<string>): Initialize {
  return async () => {
    chainId = (await provider.getNetwork()).chainId;
    apiKey = await apiKeyFetcher();

    alertConfig: {
      subscriptions: [
        {
          botId: SCAM_DETECTOR_BOT_ID,
          alertIds: SCAM_DETECTOR_ALERT_IDS,
        },
      ];
    }
  };
}

export function provideHandleAlert(
  provider: providers.Provider,
  getErc721TransfersInvolvingScammer: (
    scammerAddress: string,
    transferOccuranceTimeWindow: number,
    apiKey: string
  ) => Promise<any[]>,
  fetchNftCollectionFloorPrice: () => number
): HandleAlert {
  return async (alertEvent: AlertEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const scammerAddress = alertEvent.alert.metadata["scammer_addresses"];
    if (!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
      scammersCurrentlyMonitored[scammerAddress] = {
        firstAlertIdAppearance: alertEvent.alertId!,
        mostRecentActivityByBlockNumber: alertEvent.blockNumber!,
      };

      switch (alertEvent.alertId!) {
        case "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER":
          findings.push(
            ...(await processFraudulentNftOrders(
              provider,
              scammerAddress,
              NINETY_DAYS,
              getErc721TransfersInvolvingScammer,
              fetchNftCollectionFloorPrice
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

export function provideHandleBlock(provider: providers.Provider): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    /*
    const oneDayInChainBlocks = getBlocksInTimePeriodForChainId(ONE_DAY, chainId);

    // TODO: This check could be changed to
    // be more frequent than once a day
    if (blockEvent.blockNumber % oneDayInChainBlocks === 0) {
      Object.keys(scammersCurrentlyMonitored).map(async (scammerAddress: string) => {
        const blocksSinceScammerLastActive =
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber;
        const fraudulentNftOrderFindings = await processFraudulentNftOrders(
          provider,
          scammerAddress,
          blocksSinceScammerLastActive
        );

        findings.push(...fraudulentNftOrderFindings);

        if (fraudulentNftOrderFindings.length > 0) {
          scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = blockEvent.blockNumber;
        }

        const thirtyDaysInChainBlocks = getBlocksInTimePeriodForChainId(THIRTY_DAYS, chainId);
        if (
          blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber >
          thirtyDaysInChainBlocks
        ) {
          delete scammersCurrentlyMonitored[scammerAddress];
        }
      });
    }
    */
    return findings;
  };
}

export default {
  initialize: provideInitialize(ethersProvider, fetchApiKey),
  handleAlert: provideHandleAlert(ethersProvider, getErc721TransfersInvolvingAddress, getNftCollectionFloorPrice),
  handleBlock: provideHandleBlock(ethersProvider),
  provideInitialize,
  provideHandleAlert,
  provideHandleBlock,
};
