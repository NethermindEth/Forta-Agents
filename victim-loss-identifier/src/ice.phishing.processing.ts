// import { Finding } from "forta-agent";
// import { EXCHANGE_CONTRACT_ADDRESSES, FRAUD_NFT_SALE_VALUE_UPPER_THRESHOLD } from "./constants";
// import DataFetcher from "./fetcher";
// import { Erc20Transfer, Erc721Transfer, ScammerInfo, VictimInfo } from "./types";
// import { createFpFinding, createFraudNftOrderFinding } from "./utils/findings";
// import { isScammerFalsePositive, extractFalsePositiveDataAndUpdateState } from "./utils/utils";
import { utils, providers } from "ethers";

export const extractScammerAddresses = (txReceipt: providers.TransactionReceipt, scammerAddresses: string[]) => {
  const transferLogs = txReceipt.logs.filter((log) => log.topics[0] === utils.id("Transfer(address,address,uint256)"));

  if (!transferLogs) return;

  for (const transferLog of transferLogs) {
    const { topics } = transferLog;
    const recipientAddressToCheck = topics[2];

    // Check if topics[2] (i.e. recipient) doesn't appear as topics[1] (i.e. sender) in any of the other `Transfer` logs
    const isNotScammer = transferLogs.some((otherTransferLog) => {
      const senderAddress = otherTransferLog.topics[1];
      return senderAddress === recipientAddressToCheck;
    });

    // If topics[2] is not found as topics[1] in any other logs, add it to the scammerAddresses array
    if (!isNotScammer && recipientAddressToCheck) {
      scammerAddresses.push(utils.hexDataSlice(recipientAddressToCheck, 12));
    }
  }
};

// export async function processErc20IcePhishingTransfers(
//   scammerAddress: string,
//   erc721TransferTimeWindowInDays: number,
//   dataFetcher: DataFetcher,
//   scammers: { [key: string]: ScammerInfo },
//   victims: { [key: string]: VictimInfo },
//   chainId: number,
//   blockNumber: number
// ): Promise<Finding[]> {
//   const findings: Finding[] = [];
//   let fpAlerted = false;

//   const scammerErc20Transfers: Erc20Transfer[] = await dataFetcher.getScammerErc20IcePhishingTransfers(
//     scammerAddress,
//     erc721TransferTimeWindowInDays
//   );

//   for (const erc20Transfer of scammerErc20Transfers) {
//     const {
//       transaction_hash: exploitTxnHash,
//       contract_address: stolenTokenAddress,
//       from_address: victimAddress,
//       symbol: stolenTokenSymbol,
//     }: Erc20Transfer = erc20Transfer;
//     const txnReceipt = await dataFetcher.getTransactionReceipt(exploitTxnHash);
//     const txnLogs = txnReceipt!.logs;

//     addVictimInfoToVictims(
//       victimAddress,
//       victims,
//       scammerAddress,
//       exploitTxnHash,
//       stolenTokenAddress,
//       stolenTokenName,
//       stolenTokenSymbol,
//       txnResponse!.blockNumber!
//     );
//     linkScammerToItsVictim(scammers, scammerAddress, victims, victimAddress);
//     increaseStolenUsdAmounts(
//       scammers,
//       scammerAddress,
//       victims,
//       victimAddress,
//       exploitTxnHash,
//       stolenTokenAddress,
//       stolenTokenId,
//       nftCollectionFloorPrice
//     );
//     scammers[scammerAddress].mostRecentActivityByBlockNumber = txnResponse!.blockNumber!;

//     if (await isScammerFalsePositive(scammerAddress, scammers, dataFetcher, chainId, blockNumber)) {
//       const { fpVictims, fpData } = extractFalsePositiveDataAndUpdateState(scammerAddress, scammers, victims);
//       findings.push(createFpFinding(scammerAddress, fpVictims, fpData));
//       fpAlerted = true;
//       break;
//     } else {
//       findings.push(
//         createFraudNftOrderFinding(
//           victimAddress,
//           scammerAddress,
//           scammers[scammerAddress].firstAlertIdAppearance,
//           victims[victimAddress].totalUsdValueAcrossAllTokens!,
//           stolenTokenName,
//           stolenTokenAddress,
//           stolenTokenId,
//           victims[victimAddress].totalUsdValueAcrossAllErc721Tokens!,
//           exploitTxnHash,
//           nftCollectionFloorPrice,
//           erc721TransferTimeWindowInDays,
//           victims[victimAddress].scammedBy![scammerAddress].totalUsdValueLostToScammer
//         )
//       );
//       victims[victimAddress].scammedBy[scammerAddress].hasBeenAlerted = true;
//     }
//     // }
//   }
//   if (fpAlerted) {
//     console.log("Deleting FP scammer from state: ", scammerAddress);
//     delete scammers[scammerAddress];
//   }
//   return findings;
// }
