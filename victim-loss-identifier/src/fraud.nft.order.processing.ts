import { Finding } from "forta-agent";
import { Log } from "@ethersproject/abstract-provider";
import { utils, constants } from "ethers";
import {
  TOKENS_BURNED_AS_PAYMENT,
  EXCHANGE_CONTRACT_ADDRESSES,
  FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD,
} from "./constants";
import { createFpFinding, createFraudNftOrderFinding } from "./utils/findings";
import { Erc721Transfer, ScammerInfo, VictimInfo } from "./types";
import DataFetcher from "./fetcher";
import {
  addVictimInfoToVictims,
  extractFalsePositiveDataAndUpdateState,
  increaseStolenUsdAmounts,
  isScammerFalsePositive,
  linkScammerToItsVictim,
} from "./utils/utils";

function getSenderAddressFromTransferLogs(txnLogs: Log[], tokenAddress: string, tokenId: string): string {
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

function hasBuyerOrNftExchangeTransferredToSeller(
  txnLogs: Log[],
  buyerAddress: string,
  sellerAddress: string
): boolean {
  return txnLogs.some((log) => {
    const isTransferEvent = log.topics[0] === utils.id("Transfer(address,address,uint256)");
    const isTransferSingleEvent = log.topics[0] === utils.id("TransferSingle(address,address,address,uint256,uint256)");

    return (
      (isTransferEvent &&
        (log.topics[2].includes(sellerAddress.slice(2)) ||
          (log.topics[2].includes(constants.AddressZero) &&
            Object.values(TOKENS_BURNED_AS_PAYMENT).includes(log.address.toLowerCase()))) &&
        (log.topics[1].includes(buyerAddress.slice(2)) ||
          Object.values(EXCHANGE_CONTRACT_ADDRESSES).some((exchangeAddress) =>
            log.topics[1].includes(exchangeAddress.slice(2))
          ))) ||
      (isTransferSingleEvent &&
        log.topics[2].includes(buyerAddress.slice(2)) &&
        log.topics[3].includes(sellerAddress.slice(2)))
    );
  });
}

export async function processFraudulentNftOrders(
  scammerAddress: string,
  erc721TransferTimeWindowInDays: number,
  dataFetcher: DataFetcher,
  scammers: { [key: string]: ScammerInfo },
  victims: { [key: string]: VictimInfo },
  chainId: number,
  blockNumber: number
): Promise<Finding[]> {
  const findings: Finding[] = [];
  let fpAlerted = false;

  const scammerErc721Transfers: Erc721Transfer[] = await dataFetcher.getScammerErc721Transfers(
    scammerAddress,
    erc721TransferTimeWindowInDays
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

    const victimAddress = getSenderAddressFromTransferLogs(txnLogs, stolenTokenAddress, stolenTokenId);

    // Covers three FP cases:
    // 1) Scammer (i.e. buyer) "paying" in WETH/stablecoin instead of ETH (either directly or indirectly through an NFT exchange contract)
    // 2) Transaction being a regular NFT (ERC721 or ERC1155) trade
    // 3) Buyer paying by burning specific tokens (e.g. Blur Pool Token)
    if (hasBuyerOrNftExchangeTransferredToSeller(txnLogs, scammerAddress, victimAddress)) continue;

    if (
      // Skip over this transfer if this tokenId
      // transfer in this transaction for this
      // victim has already been accounted for
      scammers[scammerAddress].victims?.[victimAddress]?.scammedBy?.[scammerAddress].transactions?.[
        exploitTxnHash
      ]?.erc721?.[stolenTokenAddress]?.tokenIds?.includes(Number(stolenTokenId))
    ) {
      continue;
    }

    const txnResponse = await dataFetcher.getTransaction(exploitTxnHash);
    if (
      txnResponse!.to != null &&
      Object.values(EXCHANGE_CONTRACT_ADDRESSES).includes(txnResponse!.to.toLowerCase()) &&
      txnResponse!.value.lt(FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD)
    ) {
      const nftCollectionFloorPrice = await dataFetcher.getNftCollectionFloorPrice(
        stolenTokenAddress,
        txnResponse!.blockNumber!
      );

      addVictimInfoToVictims(
        victimAddress,
        victims,
        scammerAddress,
        exploitTxnHash,
        stolenTokenAddress,
        stolenTokenName,
        stolenTokenSymbol,
        null,
        txnResponse!.blockNumber!
      );
      linkScammerToItsVictim(scammers, scammerAddress, victims, victimAddress);
      increaseStolenUsdAmounts(
        scammers,
        scammerAddress,
        victims,
        victimAddress,
        exploitTxnHash,
        stolenTokenAddress,
        stolenTokenId,
        false,
        "0",
        nftCollectionFloorPrice
      );
      scammers[scammerAddress].mostRecentActivityByBlockNumber = txnResponse!.blockNumber!;

      if (await isScammerFalsePositive(scammerAddress, scammers, dataFetcher, chainId, blockNumber)) {
        const { fpVictims, fpData } = extractFalsePositiveDataAndUpdateState(scammerAddress, scammers, victims);
        findings.push(createFpFinding(scammerAddress, fpVictims, fpData));
        fpAlerted = true;
        break;
      } else {
        findings.push(
          createFraudNftOrderFinding(
            victimAddress,
            scammerAddress,
            scammers[scammerAddress].firstAlertIdAppearance,
            victims[victimAddress].totalUsdValueAcrossAllTokens!,
            stolenTokenName,
            stolenTokenAddress,
            stolenTokenId,
            victims[victimAddress].totalUsdValueAcrossAllErc721Tokens!,
            exploitTxnHash,
            nftCollectionFloorPrice,
            erc721TransferTimeWindowInDays,
            victims[victimAddress].scammedBy![scammerAddress].totalUsdValueLostToScammer
          )
        );
        victims[victimAddress].scammedBy[scammerAddress].hasBeenAlerted = true;
      }
    }
  }
  if (fpAlerted) {
    console.log("Deleting FP scammer from state: ", scammerAddress);
    delete scammers[scammerAddress];
  }
  return findings;
}
