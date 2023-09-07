import { Finding } from "forta-agent";
import { Log } from "@ethersproject/abstract-provider";
import { utils } from "ethers";
import { EXCHANGE_CONTRACT_ADDRESSES, FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD } from "./constants";
import { createFraudNftOrderFinding } from "./utils/findings";
import { Erc721Transfer, ScammerInfo, VictimInfo } from "./types";
import DataFetcher from "./fetcher";

function getVictimFromTxnLogs(txnLogs: Log[], tokenAddress: string, tokenId: string): string {
  return utils.hexDataSlice(
    txnLogs.find((log) => {
      return (
        log.address.toLowerCase() === tokenAddress &&
        log.topics[0] === utils.id("Transfer(address,address,uint256)") &&
        Number(log.topics[3]) === Number(tokenId)
      );
    })!.topics[1],
    12
  );
}

function hasBuyerTransferredToSeller(txnLogs: Log[], scammerAddress: string, victimAddress: string): boolean {
  return txnLogs.some((log) => {
    return (
      (log.topics[0] === utils.id("Transfer(address,address,uint256)") &&
        log.topics[1].includes(scammerAddress.slice(2)) &&
        log.topics[2].includes(victimAddress.slice(2))) ||
      (log.topics[0] === utils.id("TransferSingle(address,address,address,uint256,uint256)") &&
        log.topics[2].includes(scammerAddress.slice(2)) &&
        log.topics[3].includes(victimAddress.slice(2)))
    );
  });
}

function addVictimToVictimObject(
  victimAddress: string,
  victims: { [key: string]: VictimInfo },
  scammerAddress: string,
  exploitTxnHash: string,
  stolenTokenAddress: string,
  stolenTokenName: string,
  stolenTokenSymbol: string
) {
  if (!victims[victimAddress]) {
    // If victim has not previously
    // been documented, add them
    victims[victimAddress] = {
      totalUsdValueAcrossAllTokens: 0,
      totalUsdValueAcrossAllErc721Tokens: 0,
      scammedBy: {
        [scammerAddress]: {
          totalUsdValueLostToScammer: 0,
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
      },
    };
  } else if (!victims[victimAddress].scammedBy[scammerAddress]) {
    // If victim has not previously been documented to have
    // been scammed by this scammer, add them as an entry
    victims[victimAddress].scammedBy[scammerAddress] = {
      totalUsdValueLostToScammer: 0,
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
  } else if (!victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash]) {
    // If victim doesn't have _this_ specific transaction, add as new entry
    victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash] = {
      erc721: {
        [stolenTokenAddress]: {
          tokenName: stolenTokenName,
          tokenSymbol: stolenTokenSymbol,
          tokenIds: [],
          tokenTotalUsdValue: 0,
        },
      },
    };
  } else if (
    !victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash].erc721![stolenTokenAddress]
  ) {
    // In scenario a victim loses NFTs from different collections in the same
    // transaction, add additional collection info under the same transaction.
    victims[victimAddress].scammedBy[scammerAddress].transactions[exploitTxnHash].erc721![stolenTokenAddress] = {
      tokenName: stolenTokenName,
      tokenSymbol: stolenTokenSymbol,
      tokenIds: [],
      tokenTotalUsdValue: 0,
    };
  }
}

function linkScammersToVictims(
  scammersCurrentlyMonitored: { [key: string]: ScammerInfo },
  scammerAddress: string,
  victimAddress: string,
  victims: { [key: string]: VictimInfo }
) {
  if (!scammersCurrentlyMonitored[scammerAddress].victims) {
    // If scammer has no victim, add `victims` property
    scammersCurrentlyMonitored[scammerAddress].victims = {
      [victimAddress]: victims[victimAddress],
    };
  } else if (!scammersCurrentlyMonitored[scammerAddress].victims![victimAddress]) {
    // else if scammer doesn't have _this_ specific victim, add as new entry
    scammersCurrentlyMonitored[scammerAddress].victims![victimAddress] = victims[victimAddress];
  }
}

function incrementStolenUsdAmounts(
  scammersCurrentlyMonitored: { [key: string]: ScammerInfo },
  scammerAddress: string,
  victims: { [key: string]: VictimInfo },
  victimAddress: string,
  exploitTxnHash: string,
  stolenTokenAddress: string,
  stolenTokenId: string,
  nftCollectionFloorPrice: number
) {
  scammersCurrentlyMonitored[scammerAddress].totalUsdValueStolen += nftCollectionFloorPrice;

  const currentVictim = victims[victimAddress];
  currentVictim.totalUsdValueAcrossAllTokens! += nftCollectionFloorPrice;
  currentVictim.totalUsdValueAcrossAllErc721Tokens! += nftCollectionFloorPrice;
  currentVictim.scammedBy![scammerAddress].totalUsdValueLostToScammer += nftCollectionFloorPrice;

  const currentVictimStolenErc721Info =
    currentVictim.scammedBy[scammerAddress].transactions[exploitTxnHash].erc721![stolenTokenAddress];
  currentVictimStolenErc721Info.tokenTotalUsdValue! += nftCollectionFloorPrice;
  currentVictimStolenErc721Info.tokenIds!.push(Number(stolenTokenId));
}

export async function processFraudulentNftOrders(
  scammerAddress: string,
  erc721TransferTimeWindow: number,
  dataFetcher: DataFetcher,
  scammersCurrentlyMonitored: { [key: string]: ScammerInfo },
  victims: { [key: string]: VictimInfo }
): Promise<Finding[]> {
  const findings: Finding[] = [];

  const scammerErc721Transfers: Erc721Transfer[] = await dataFetcher.getScammerErc721Transfers(
    scammerAddress,
    erc721TransferTimeWindow
  );

  for (const erc721Transfer of scammerErc721Transfers) {
    const {
      transaction_hash: exploitTxnHash,
      contract_address: stolenTokenAddress,
      name: stolenTokenName,
      symbol: stolenTokenSymbol,
      token_id: stolenTokenId,
    }: Erc721Transfer = erc721Transfer;
    const txnReceipt = await dataFetcher.getTransactionReceipt(exploitTxnHash);
    const txnLogs = txnReceipt!.logs;

    const victimAddress = getVictimFromTxnLogs(txnLogs, stolenTokenAddress, stolenTokenId);

    // Covers two FP cases:
    // 1) Scammer (i.e. buyer) "paying" in WETH/stablecoin instead of ETH
    // 2) Transaction being a regular NFT trade
    // TODO: Add FP mitigation alert if the transaction is the one that generated the source alert
    if (hasBuyerTransferredToSeller(txnLogs, scammerAddress, victimAddress)) continue;

    if (
      // Skip over this transfer if this tokenId
      // transfer in this transaction for this
      // victim has already been accounted for
      scammersCurrentlyMonitored[scammerAddress].victims?.[victimAddress]?.scammedBy?.[scammerAddress].transactions?.[
        exploitTxnHash
      ]?.erc721?.[stolenTokenAddress]?.tokenIds?.includes(Number(stolenTokenId))
    ) {
      continue;
    }

    const txnResponse = await dataFetcher.getTransaction(exploitTxnHash);
    if (
      txnResponse!.to != null &&
      Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse!.to) &&
      txnResponse!.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD)
    ) {
      const nftCollectionFloorPrice = await dataFetcher.getNftCollectionFloorPrice(
        stolenTokenAddress,
        txnResponse!.blockNumber!
      );

      addVictimToVictimObject(
        victimAddress,
        victims,
        scammerAddress,
        exploitTxnHash,
        stolenTokenAddress,
        stolenTokenName,
        stolenTokenSymbol
      );
      linkScammersToVictims(scammersCurrentlyMonitored, scammerAddress, victimAddress, victims);
      incrementStolenUsdAmounts(
        scammersCurrentlyMonitored,
        scammerAddress,
        victims,
        victimAddress,
        exploitTxnHash,
        stolenTokenAddress,
        stolenTokenId,
        nftCollectionFloorPrice
      );

      findings.push(
        createFraudNftOrderFinding(
          victimAddress,
          scammerAddress,
          scammersCurrentlyMonitored[scammerAddress].firstAlertIdAppearance,
          victims[victimAddress].totalUsdValueAcrossAllTokens!,
          stolenTokenName,
          stolenTokenAddress,
          stolenTokenId,
          victims[victimAddress].totalUsdValueAcrossAllErc721Tokens!,
          exploitTxnHash,
          nftCollectionFloorPrice,
          erc721TransferTimeWindow
        )
      );
    }
  }

  return findings;
}
