import {
  BlockEvent,
  Finding,
  Initialize,
  HandleBlock,
  HandleAlert,
  AlertEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";
import { providers } from "ethers";
import {
  SCAM_DETECTOR_BOT_ID,
  SCAM_DETECTOR_ALERT_IDS,
  NINETY_DAYS,
  EXCHANGE_CONTRACT_ADDRESSES,
  FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD_IN_WEI,
} from "./constants";
import { ScammerInfo } from "./types";

const scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};

function getErc721Transfers(): any[] {
  return [];
}

async function processFraudulentNftOrders(alertEvent: AlertEvent, provider: providers.Provider): Promise<Finding[]> {
  const findings: Finding[] = [];

  const scammerAddress = alertEvent.alert.metadata["scammer_addresses"];
  if (!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
    // TODO: Figure out what to do in case the alert's blockNumber is `undefined`.
    // Could the Scam Detector push such alerts?
    if (alertEvent.blockNumber) {
      scammersCurrentlyMonitored[scammerAddress].mostRecentActivityByBlockNumber = alertEvent.blockNumber;
    }

    // TODO: Give this an actual defined type
    const erc721Transfers: any[] = getErc721Transfers();

    // TODO: Give this an actual defined type
    erc721Transfers.map(async (erc721Transfer: any) => {
      const {
        tx_hash: txnHash,
        from_address: fromAddress,
        contract_address: contractAddress,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        token_id: tokenId,
      } = erc721Transfer;

      // TODO: Add logic to not proceed if `from`
      // is associated with the scammer

      const txnResponse = await provider.getTransaction(txnHash);
      if (txnResponse.to != null) {
        if (
          Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse.to) &&
          txnResponse.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD_IN_WEI)
        ) {
          // TODO: Fetch collection floor price
          // and to add it to `tokenTotalUsdValue`
          // for the current `tokenId`

          scammersCurrentlyMonitored[scammerAddress].victims[fromAddress][txnHash].erc721 = {
            [contractAddress]: {
              tokenName,
              tokenSymbol,
              // TODO: This may override current
              // victim's tokenIds. Fix.
              tokenIds: tokenId,
            },
          };
        }
      }
    });
  }

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
