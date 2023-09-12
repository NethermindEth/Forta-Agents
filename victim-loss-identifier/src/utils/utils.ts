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

  return timePeriodInSecs / chainBlockTime;
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
      if (victims[victimAddress]) delete victims[victimAddress];
    } else if (victims[victimAddress]) {
      victims[victimAddress].totalUsdValueAcrossAllTokens! -= scammedBy[scammerAddress].totalUsdValueLostToScammer;
      delete victims[victimAddress].scammedBy[scammerAddress];
    }

    delete scammersCurrentlyMonitored[scammerAddress];
  }

  return [fpVictims, fpData];
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
