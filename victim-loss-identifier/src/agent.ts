import { BlockEvent, Finding, Initialize, HandleBlock, HandleAlert, AlertEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
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
import { getBlocksInTimePeriodForChainId } from "./utils/utils";

const provider: providers.Provider = getEthersProvider();
let chainId: number;

const scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};

// TODO: Add implementation
function getErc721TransfersInvolvingScammer(scammerAddress: string, transferOccuranceTimeWindow: number): any[] {
  return [];
}

// TODO: Add implementation
function fetchNftCollectionFloorPrice(): number {
  return 0;
}

async function processFraudulentNftOrders(
  provider: providers.Provider,
  scammerAddress: string,
  erc721TransferTimeWindow: number
): Promise<Finding[]> {
  const findings: Finding[] = [];

  // TODO: Give this an actual defined type
  const scammerErc721Transfers: any[] = getErc721TransfersInvolvingScammer(scammerAddress, erc721TransferTimeWindow);

  // TODO: Give this an actual defined type
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

    if (
      !scammersCurrentlyMonitored[scammerAddress].victims[victimAddress].transactions[exploitTxnHash].erc721[
        stolenTokenAddress
      ].tokenIds.includes(stolenTokenId)
    ) {
      const txnResponse = await provider.getTransaction(exploitTxnHash);
      if (
        txnResponse.to != null &&
        Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse.to) &&
        txnResponse.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD)
      ) {
        const nftCollectionFloorPrice = fetchNftCollectionFloorPrice();

        const { tokenIds: currentTokenIds, tokenTotalUsdValue: currentTokenTotalUsdValue } =
          scammersCurrentlyMonitored[scammerAddress].victims[victimAddress].transactions[exploitTxnHash].erc721[
            stolenTokenAddress
          ];

        scammersCurrentlyMonitored[scammerAddress].victims[victimAddress].transactions[exploitTxnHash].erc721[
          stolenTokenAddress
        ] = {
          // TODO: Would this be an issue if it
          // overwrites the existing name and symbol?
          tokenName: stolenTokenName,
          tokenSymbol: stolenTokenSymbol,
          tokenIds: [...currentTokenIds, stolenTokenId],
          tokenTotalUsdValue: currentTokenTotalUsdValue + nftCollectionFloorPrice,
        };

        findings.push(
          createFraudNftOrderFinding(
            victimAddress,
            scammerAddress,
            scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance,
            scammersCurrentlyMonitored[scammerAddress].victims[victimAddress].totalUsdValueAcrossAllTokens,
            stolenTokenName,
            stolenTokenAddress,
            stolenTokenId,
            scammersCurrentlyMonitored[scammerAddress].victims[victimAddress].transactions[exploitTxnHash].erc721[
              stolenTokenAddress
            ].tokenTotalUsdValue,
            exploitTxnHash,
            nftCollectionFloorPrice
          )
        );
      }
    }
  });

  return findings;
}

export function provideInitialize(provider: providers.Provider): Initialize {
  return async () => {
    chainId = (await provider.getNetwork()).chainId;

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

export function provideHandleAlert(provider: providers.Provider): HandleAlert {
  return async (alertEvent: AlertEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const scammerAddress = alertEvent.alert.metadata["scammer_addresses"];
    if (!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
      scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance = alertEvent.alertId!;
      scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = alertEvent.blockNumber!;

      switch (alertEvent.alertId!) {
        case "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER":
          findings.push(...(await processFraudulentNftOrders(provider, scammerAddress, NINETY_DAYS)));
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

    return findings;
  };
}

export default {
  initialize: provideInitialize(provider),
  handleAlert: provideHandleAlert(provider),
  handleBlock: provideHandleBlock,
};
