import { ScammerInfo, VictimInfo, FpTransaction } from "src/types";

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

export function cleanObject(object: { [key: string]: ScammerInfo }) {
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

  Object.keys(fpScammer.victims!).forEach((victimAddress) => {
    const victimInfo = fpScammer.victims![victimAddress];
    const scammedBy = victimInfo.scammedBy;

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
          const tokenIds = erc721TokenInfo.tokenIds!;

          // Format ERC721 data as "tokenId,tokenAddress"
          tokenIds.forEach((tokenId) => {
            extractedTransaction.nfts.push(`${tokenId},${tokenAddress}`);
          });
        });
      }

      // TODO: Remove ERC1155s?
      if (transaction.erc1155) {
        // Iterate through ERC1155 tokens in the transaction
        Object.keys(transaction.erc1155).forEach((tokenAddress) => {
          const erc1155TokenInfo = transaction.erc1155![tokenAddress];
          const tokenIds = Object.keys(erc1155TokenInfo.tokenIds);

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
      delete victims[victimAddress];
    } else {
      delete victims[victimAddress].scammedBy[scammerAddress];
    }

    delete scammersCurrentlyMonitored[scammerAddress];
  });

  return [fpVictims, fpData];
}

//TODO: Implementation
export function isScammerFalsePositive(
  scammerAddress: string,
  scammersCurrentlyMonitored: { [key: string]: ScammerInfo }
) {}
