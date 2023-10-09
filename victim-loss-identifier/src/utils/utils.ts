import DataFetcher from "src/fetcher";
import {
  FP_MAX_VICTIMS_THRESHOLD,
  FP_MIN_VICTIMS_THRESHOLD,
  FP_PROFIT_THRESHOLD,
  FP_SELLER_TO_BUYER_TXS_THRESHOLD,
} from "../constants";
import { ScammerInfo, VictimInfo, FpTransaction, EtherscanApisInterface } from "../types";

export function getChainBlockTime(chainId: number): number {
  switch (chainId) {
    case 10: // Optimism
      return 2;
    case 56: // BNB Smart Chain
      return 3;
    case 137: // Polygon
      return 2;
    case 250: // Fantom
      return 2;
    case 42161: // Arbitrum
      return 1;
    case 43114: // Avalance
      return 2;
    default: // Ethereum
      return 12;
  }
}

export function getBlocksInTimePeriodForChainId(timePeriodInSecs: number, chainId: number): number {
  const chainBlockTime = getChainBlockTime(chainId);

  return Math.floor(timePeriodInSecs / chainBlockTime);
}

export function cleanObject(object: { [key: string]: ScammerInfo } | { [key: string]: VictimInfo }) {
  // Sort and delete 1/4 of the keys
  const sortedKeys = Object.keys(object).sort((a, b) => {
    const latestTimestampA = object[a].mostRecentActivityByBlockNumber;
    const latestTimestampB = object[b].mostRecentActivityByBlockNumber;
    return latestTimestampA - latestTimestampB;
  });

  // Ensure that at least one key will be deleted in the theoretical edge case where Math.floor(sortedKeys.length / 4) equals 0
  const indexToDelete = Math.max(1, Math.floor(sortedKeys.length / 4));

  for (let i = 0; i < indexToDelete; i++) {
    delete object[sortedKeys[i]];
  }
}

export function extractFalsePositiveDataAndUpdateState(
  scammerAddress: string,
  scammersCurrentlyMonitored: { [key: string]: ScammerInfo },
  victims: { [key: string]: VictimInfo }
) {
  const fpData: FpTransaction[] = [];
  const fpVictims: string[] = [];
  const fpScammer = scammersCurrentlyMonitored[scammerAddress];

  for (const victimAddress of Object.keys(fpScammer.victims!)) {
    const victimInfo = fpScammer.victims![victimAddress];
    const scammedBy = victimInfo.scammedBy;

    const hasBeenAlerted = scammedBy[scammerAddress].hasBeenAlerted;
    // Looking for victim's scammers that have had alerts
    // emitted to create an FP alert to "undo" the first one.
    // If they have no existing alert to "undo", skip.
    if (!hasBeenAlerted) continue;

    const transactions = scammedBy[scammerAddress].transactions;

    Object.keys(transactions).forEach((txHash) => {
      const transaction = transactions[txHash];
      const extractedTransaction: FpTransaction = {
        txHash,
        nfts: [],
      };

      if (transaction.erc721) {
        // Iterate through ERC721 tokens
        Object.keys(transaction.erc721).forEach((tokenAddress) => {
          const erc721TokenInfo = transaction.erc721![tokenAddress];
          const tokenIds = erc721TokenInfo.tokenIds;

          if (victims[victimAddress].totalUsdValueAcrossAllErc721Tokens) {
            victims[victimAddress].totalUsdValueAcrossAllErc721Tokens! -= erc721TokenInfo.tokenTotalUsdValue!;
          }
          // Format ERC721 data as "tokenId,tokenAddress"
          tokenIds.forEach((tokenId) => {
            extractedTransaction.nfts.push(`${tokenId},${tokenAddress}`);
          });
        });
      }

      if (transaction.erc1155) {
        // Iterate through ERC1155 tokens in the transaction
        Object.keys(transaction.erc1155).forEach((tokenAddress) => {
          const erc1155TokenInfo = transaction.erc1155![tokenAddress];
          const tokenIds = Object.keys(erc1155TokenInfo.tokenIds);

          if (victims[victimAddress].totalUsdValueAcrossAllErc1155Tokens) {
            victims[victimAddress].totalUsdValueAcrossAllErc1155Tokens! -= erc1155TokenInfo.tokenTotalUsdValue!;
          }
          // Format ERC1155 data as "tokenId,amount,tokenAddress"
          tokenIds.forEach((tokenId) => {
            const amount = erc1155TokenInfo.tokenIds[Number(tokenId)];
            extractedTransaction.nfts.push(`${tokenId},${amount},${tokenAddress}`);
          });
        });
      }

      fpData.push(extractedTransaction);
    });

    // Check if the victim has been "scammed" only by one (this) address
    if (Object.keys(scammedBy).length === 1) {
      fpVictims.push(victimAddress);
      if (victims[victimAddress]) {
        console.log("Deleting FP victim from victims: ", victimAddress);
        delete victims[victimAddress];
      }
    } else if (victims[victimAddress]) {
      victims[victimAddress].totalUsdValueAcrossAllTokens! -= scammedBy[scammerAddress].totalUsdValueLostToScammer;
      console.log(`Deleting FP scammer (${scammerAddress}) from victims of victim address:  ${victimAddress}`);
      delete victims[victimAddress].scammedBy[scammerAddress];
    }
  }

  return {
    fpVictims,
    fpData,
  };
}

export function linkScammerToItsVictim(
  scammers: { [key: string]: ScammerInfo },
  scammerAddress: string,
  victims: { [key: string]: VictimInfo },
  victimAddress: string
) {
  if (!scammers[scammerAddress].victims) {
    // If scammer has no victims, add first victim
    scammers[scammerAddress].victims = {
      [victimAddress]: victims[victimAddress],
    };
  } else if (!scammers[scammerAddress].victims![victimAddress]) {
    // If scammer doesn't have _this_ specific victim, add victim
    scammers[scammerAddress].victims![victimAddress] = victims[victimAddress];
  }
}

export function addVictimInfoToVictims(
  victimAddress: string,
  victims: { [key: string]: VictimInfo },
  scammerAddress: string,
  exploitTxnHash: string,
  stolenTokenAddress: string,
  stolenTokenName: string,
  stolenTokenSymbol: string,
  stolenTokenDecimals: number | null,
  transactionBlockNumber: number
) {
  if (!victims[victimAddress]) {
    // If victim has not previously
    // been documented, add them
    victims[victimAddress] = {
      mostRecentActivityByBlockNumber: transactionBlockNumber,
      totalUsdValueAcrossAllTokens: 0,
      totalUsdValueAcrossAllErc721Tokens: 0,
      totalUsdValueAcrossAllErc20Tokens: 0,
      scammedBy: {
        [scammerAddress]: {
          totalUsdValueLostToScammer: 0,
          hasBeenAlerted: false,
          transactions: {},
        },
      },
    };
  }

  if (!victims[victimAddress].scammedBy[scammerAddress]) {
    // If victim has not previously been documented to have
    // been scammed by this scammer, add them as an entry
    victims[victimAddress].scammedBy[scammerAddress] = {
      totalUsdValueLostToScammer: 0,
      hasBeenAlerted: false,
      transactions: {},
    };
  }

  if (!victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash]) {
    // If victim, having been already scammed by this scammer,
    // doesn't have _this_ specific transaction, add as new entry
    victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash] = {};
  }

  const transaction = victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash];

  if (stolenTokenDecimals === null) {
    // ERC721 Transaction
    transaction.erc721 = {
      [stolenTokenAddress]: {
        tokenName: stolenTokenName,
        tokenSymbol: stolenTokenSymbol,
        tokenIds: [],
        tokenTotalUsdValue: 0,
      },
    };
  } else {
    // ERC20 Transaction
    transaction.erc20 = {
      [stolenTokenAddress]: {
        tokenName: stolenTokenName,
        tokenSymbol: stolenTokenSymbol,
        tokenAmount: 0,
        tokenTotalUsdValue: 0,
        tokenDecimal: stolenTokenDecimals,
      },
    };
  }

  // Update its most recent block
  victims[victimAddress].mostRecentActivityByBlockNumber = transactionBlockNumber;
}

export function increaseStolenUsdAmounts(
  scammers: { [key: string]: ScammerInfo },
  scammerAddress: string,
  victims: { [key: string]: VictimInfo },
  victimAddress: string,
  exploitTxnHash: string,
  stolenTokenAddress: string,
  stolenTokenId: string | null,
  isTokenErc20: boolean,
  stolenTokenValue: string,
  usdPrice: number
) {
  scammers[scammerAddress].totalUsdValueStolen += usdPrice;

  const currentVictim = victims[victimAddress];
  currentVictim.totalUsdValueAcrossAllTokens! += usdPrice;
  currentVictim.scammedBy[scammerAddress].totalUsdValueLostToScammer += usdPrice;

  if (isTokenErc20) {
    currentVictim.totalUsdValueAcrossAllErc20Tokens! += usdPrice;
    const currentVictimStolenErc20Info =
      currentVictim.scammedBy[scammerAddress].transactions[exploitTxnHash].erc20![stolenTokenAddress];
    currentVictimStolenErc20Info.tokenAmount += Number(stolenTokenValue);
    currentVictimStolenErc20Info.tokenTotalUsdValue! += usdPrice;
  } else {
    currentVictim.totalUsdValueAcrossAllErc721Tokens! += usdPrice;
    const currentVictimStolenErc721Info =
      currentVictim.scammedBy[scammerAddress].transactions[exploitTxnHash].erc721![stolenTokenAddress];
    currentVictimStolenErc721Info.tokenTotalUsdValue! += usdPrice;
    currentVictimStolenErc721Info.tokenIds.push(Number(stolenTokenId));
  }
}

export const etherscanApis: EtherscanApisInterface = {
  1: {
    tokenTx: "https://api.etherscan.io/api?module=account&action=tokentx",
    nftTx: "https://api.etherscan.io/api?module=account&action=tokennfttx",
  },
  10: {
    tokenTx: "https://api-optimistic.etherscan.io/api?module=account&action=tokentx",
    nftTx: "https://api-optimistic.etherscan.io/api?module=account&action=tokennfttx",
  },
  56: {
    tokenTx: "https://api.bscscan.com/api?module=account&action=tokentx",
    nftTx: "https://api.bscscan.com/api?module=account&action=tokennfttx",
  },
  137: {
    tokenTx: "https://api.polygonscan.com/api?module=account&action=tokentx",
    nftTx: "https://api.polygonscan.com/api?module=account&action=tokennfttx",
  },
  250: {
    tokenTx: "https://api.ftmscan.com/api?module=account&action=tokentx",
    nftTx: "https://api.ftmscan.com/api?module=account&action=tokennfttx",
  },
  42161: {
    tokenTx: "https://api.arbiscan.io/api?module=account&action=tokentx",
    nftTx: "https://api.arbiscan.io/api?module=account&action=tokennfttx",
  },
  43114: {
    tokenTx: "https://api.snowtrace.io/api?module=account&action=tokentx",
    nftTx: "https://api.snowtrace.io/api?module=account&action=tokennfttx",
  },
};

export const getChainByChainId = (chainId: number) => {
  switch (Number(chainId)) {
    case 10:
      return "optimism";
    case 56:
      return "bsc";
    case 137:
      return "polygon";
    case 250:
      return "fantom";
    case 42161:
      return "arbitrum";
    case 43114:
      return "avax";
    default:
      return "ethereum";
  }
};

export async function isScammerFalsePositive(
  scammerAddress: string,
  scammersCurrentlyMonitored: { [key: string]: ScammerInfo },
  dataFetcher: DataFetcher,
  chainId: number,
  blockNumber: number
) {
  const scammerInfo = scammersCurrentlyMonitored[scammerAddress];
  const victims = scammerInfo.victims!;

  if (
    scammerInfo.totalUsdValueStolen > FP_PROFIT_THRESHOLD &&
    Object.keys(victims).length > FP_MIN_VICTIMS_THRESHOLD &&
    Object.keys(victims).length < FP_MAX_VICTIMS_THRESHOLD
  ) {
    return true;
  }

  Object.keys(victims).forEach((victimAddress) => {
    const victimInfo = victims[victimAddress];
    const transactions = Object.keys(victimInfo.scammedBy[scammerAddress].transactions);
    if (transactions.length > FP_SELLER_TO_BUYER_TXS_THRESHOLD) {
      return true;
    }
  });

  if (await dataFetcher.hasBuyerTransferredTokenToSeller(scammerAddress, Object.keys(victims), chainId, blockNumber))
    return true;

  return false;
}
