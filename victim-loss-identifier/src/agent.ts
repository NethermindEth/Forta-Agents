import { BlockEvent, Finding, Initialize, HandleBlock, HandleAlert, AlertEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import {
  SCAM_DETECTOR_BOT_ID,
  SCAM_DETECTOR_ALERT_IDS,
  ONE_DAY,
  NINETY_DAYS,
  EXCHANGE_CONTRACT_ADDRESSES,
  FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD,
} from "./constants";
import { ScammerInfo } from "./types";
import { createFraudNftOrderFinding } from "./utils/findings";

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

export function provideInitialize(): Initialize {
  return async () => {
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
    if (
      alertEvent.alertId === "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER" &&
      !Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)
    ) {
      scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance = alertEvent.alertId!;
      scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = alertEvent.blockNumber!;
      findings.push(...(await processFraudulentNftOrders(provider, scammerAddress, NINETY_DAYS)));
    }

    return findings;
  };
}

export function provideHandleBlock(): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if(blockEvent.blockNumber) {

    }

    return findings;
  };
}

export default {
  initialize: provideInitialize,
  handleAlert: provideHandleAlert(getEthersProvider()),
  handleBlock: provideHandleBlock,
};
