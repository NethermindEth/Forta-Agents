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
import { ScammerInfo, Erc721Transfer, apiKeys } from "./types";
import { createFraudNftOrderFinding } from "./utils/findings";
import { getBlocksInTimePeriodForChainId, fetchApiKeys } from "./utils/utils";
import DataFetcher from "./fetcher";
import { getSecrets } from "./storage";

let chainId: number;
let apiKeys: apiKeys;
let dataFetcher: DataFetcher = {} as any;

const scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};

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

  await Promise.all(
    scammerErc721Transfers.map(async (erc721Transfer: Erc721Transfer) => {
      const {
        transaction_hash: exploitTxnHash,
        contract_address: stolenTokenAddress,
        name: stolenTokenName,
        symbol: stolenTokenSymbol,
        token_id: stolenTokenId,
      }: Erc721Transfer = erc721Transfer;

      const txnReceipt = await dataFetcher.getTransactionReceipt(exploitTxnHash);

      const victimAddress = utils.hexDataSlice(
        txnReceipt!.logs.find((log) => {
          log.address === stolenTokenAddress &&
            log.topics[0] === utils.id("Transfer(address,address,uint256)") &&
            log.topics[3] === utils.hexZeroPad(utils.hexValue(stolenTokenId), 32);
        })!.topics[1],
        26
      );

      if (
        // With some of these properties being optional,
        // we need checks to confirm they are not `undefined`.
        scammersCurrentlyMonitored[scammerAddress].victims !== undefined &&
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress] !== undefined &&
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions !== undefined &&
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash] !==
          undefined &&
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721 !==
          undefined &&
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
          stolenTokenAddress
        ] !== undefined &&
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
          stolenTokenAddress
        ].tokenIds !== undefined &&
        // Skip over this transfer if this tokenId
        // transfer in this transaction for this
        // victim has already been accounted for
        scammersCurrentlyMonitored[scammerAddress].victims![victimAddress].transactions![exploitTxnHash].erc721![
          stolenTokenAddress
        ].tokenIds!.includes(Number(stolenTokenId))
      ) {
        // TODO: Update to "skip" over this transfer
        // in `scammerErc721Transfers`, instead of
        // returning the findings, which would conclude
        // the logic execution
        return findings;
      }

      const txnResponse = await dataFetcher.getTransaction(exploitTxnHash);
      if (
        txnResponse!.to != null &&
        Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse!.to) &&
        txnResponse!.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD)
      ) {
        const nftCollectionFloorPrice = await dataFetcher.getNftCollectionFloorPrice(
          stolenTokenAddress,
          txnResponse!.timestamp!
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
            nftCollectionFloorPrice
          )
        );
      }
    })
  );

  return findings;
}

export function provideInitialize(
  provider: providers.Provider,
  getSecrets: () => Promise<object>,
  dataFetcher: DataFetcher
): Initialize {
  return async () => {
    chainId = (await provider.getNetwork()).chainId;
    apiKeys = (await getSecrets()) as apiKeys;
    dataFetcher = new DataFetcher(provider, apiKeys);

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

export function provideHandleAlert(): HandleAlert {
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

    const blocksInOneDay = getBlocksInTimePeriodForChainId(ONE_DAY, chainId);

    if (blockEvent.blockNumber % blocksInOneDay === 0) {
      await Promise.all(
        Object.keys(scammersCurrentlyMonitored).map(async (scammerAddress: string) => {
          const blocksSinceScammerLastActive =
            blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber;

          const fraudulentNftOrderFindings = await processFraudulentNftOrders(
            scammerAddress,
            blocksSinceScammerLastActive,
            dataFetcher
          );

          if (fraudulentNftOrderFindings.length > 0) {
            scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = blockEvent.blockNumber;
          }

          findings.push(...fraudulentNftOrderFindings);

          const blocksInThirtyDays = getBlocksInTimePeriodForChainId(THIRTY_DAYS, chainId);
          if (
            blockEvent.blockNumber - scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber >
            blocksInThirtyDays
          ) {
            delete scammersCurrentlyMonitored[scammerAddress];
          }
        })
      );
    }

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider(), getSecrets, dataFetcher),
  handleAlert: provideHandleAlert(),
  handleBlock: provideHandleBlock(),
  provideInitialize,
  provideHandleAlert,
  provideHandleBlock,
};
