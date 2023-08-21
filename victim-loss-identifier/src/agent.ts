import {
  BlockEvent,
  Finding,
  Initialize,
  HandleBlock,
  HandleAlert,
  AlertEvent,
  getEthersProvider,
} from "forta-agent";
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
function getErc721Transfers(scammerAddress: string, transferOccuranceTimeWindow: number): any[] {
  return [];
}

// TODO: Add implementation
function isVictimAddressAssociatedWithScammer(addressOfInterest: string, scammerAddress: string): boolean {
  return false;
}

// TODO: Add implementation
function fetchNftCollectionFloorPrice(): number {
  return 0;
}

async function processFraudulentNftOrders(alertEvent: AlertEvent, provider: providers.Provider): Promise<Finding[]> {
  const findings: Finding[] = [];

  const scammerAddress = alertEvent.alert.metadata["scammer_addresses"];

  if (alertEvent.blockNumber === undefined) {
    return findings;
  } else if (alertEvent.blockNumber) {
    scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = alertEvent.blockNumber;
  }

  let erc721TransferTimeWindow: number;
  if(!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
    if (alertEvent.alertId) {
      scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance = alertEvent.alertId;
    }
    erc721TransferTimeWindow = NINETY_DAYS;
  } else {
    erc721TransferTimeWindow = ONE_DAY;
  }

  // TODO: Give this an actual defined type
  const erc721Transfers: any[] = getErc721Transfers(scammerAddress, erc721TransferTimeWindow);

  // TODO: Give this an actual defined type
  erc721Transfers.map(async (erc721Transfer: any) => {
    // TODO: Give this an actual defined type
    const {
      tx_hash: exploitTxnHash,
      from_address: victimAddress,
      contract_address: stolenTokenAddress,
      token_name: stolenTokenName,
      token_symbol: stolenTokenSymbol,
      token_id: stolenTokenId,
    } = erc721Transfer;

    if (!Object.keys(scammersCurrentlyMonitored[scammerAddress].victims[victimAddress].transactions).includes(exploitTxnHash)) {
      if (isVictimAddressAssociatedWithScammer(victimAddress, scammerAddress)) {
        // TODO: Add logic to skip this particular set of info
        // from this transfer
      }

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
        );}
    };
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

    if (alertEvent.alertId === "SCAM-DETECTOR-FRAUDULENT-NFT-ORDER") {
      findings.push(...(await processFraudulentNftOrders(alertEvent, provider)));
    }

    return findings;
  };
}

export function provideHandleBlock(): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    return findings;
  };
}

export default {
  initialize: provideInitialize,
  handleAlert: provideHandleAlert(getEthersProvider()),
  handleBlock: provideHandleBlock,
};
