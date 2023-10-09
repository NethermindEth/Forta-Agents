import { Finding } from "forta-agent";
import DataFetcher from "./fetcher";
import { IcePhishingTransfer, ScammerInfo, VictimInfo } from "./types";
import { utils, providers } from "ethers";
import {
  addVictimInfoToVictims,
  extractFalsePositiveDataAndUpdateState,
  increaseStolenUsdAmounts,
  isScammerFalsePositive,
  linkScammerToItsVictim,
} from "./utils/utils";
import { createFpFinding, createIcePhishingFinding } from "./utils/findings";

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

export async function processIcePhishingTransfers(
  scammerAddress: string,
  icePhishingTransferTimeWindowInDays: number,
  dataFetcher: DataFetcher,
  scammers: { [key: string]: ScammerInfo },
  victims: { [key: string]: VictimInfo },
  chainId: number,
  alertBlockNumber: number
): Promise<Finding[]> {
  const findings: Finding[] = [];
  let fpAlerted = false;

  const scammerIcePhishingTransfers: IcePhishingTransfer[] = await dataFetcher.getScammerIcePhishingTransfers(
    scammerAddress,
    icePhishingTransferTimeWindowInDays,
    chainId
  );

  for (const icePhishingTransfer of scammerIcePhishingTransfers) {
    const {
      transaction_hash: exploitTxnHash,
      contract_address: stolenTokenAddress,
      from_address: victimAddress,
      symbol: stolenTokenSymbol,
      name: originalStolenTokenName,
      token_id: stolenTokenId,
      decimals: stolenTokenDecimals,
      value: stolenTokenValue,
      block_number: blockNumber,
    }: IcePhishingTransfer = icePhishingTransfer;
    // Zettablock doesn't return token name for ERC20s
    let stolenTokenName = originalStolenTokenName;
    if (!originalStolenTokenName) {
      stolenTokenName = await dataFetcher.getTokenName(stolenTokenAddress, blockNumber);
    }

    let nftCollectionFloorPrice: number | null = null;
    let stolenTokenUsdValue: number | null = null;

    if (!stolenTokenDecimals) {
      nftCollectionFloorPrice = await dataFetcher.getNftCollectionFloorPrice(stolenTokenAddress, blockNumber);
    } else {
      stolenTokenUsdValue = await dataFetcher.getValueInUsd(
        blockNumber,
        chainId,
        stolenTokenValue!,
        stolenTokenAddress,
        stolenTokenDecimals
      );
    }

    addVictimInfoToVictims(
      victimAddress,
      victims,
      scammerAddress,
      exploitTxnHash,
      stolenTokenAddress,
      stolenTokenName!,
      stolenTokenSymbol,
      stolenTokenDecimals,
      blockNumber
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
      stolenTokenDecimals ? true : false,
      stolenTokenDecimals ? stolenTokenValue! : "0",
      stolenTokenDecimals ? stolenTokenUsdValue! : nftCollectionFloorPrice!
    );
    scammers[scammerAddress].mostRecentActivityByBlockNumber = blockNumber;

    if (await isScammerFalsePositive(scammerAddress, scammers, dataFetcher, chainId, alertBlockNumber)) {
      const { fpVictims, fpData } = extractFalsePositiveDataAndUpdateState(scammerAddress, scammers, victims);
      findings.push(createFpFinding(scammerAddress, fpVictims, fpData));
      fpAlerted = true;
      break;
    } else {
      findings.push(
        createIcePhishingFinding(
          victimAddress,
          scammerAddress,
          scammers[scammerAddress].firstAlertIdAppearance,
          victims[victimAddress].totalUsdValueAcrossAllTokens!,
          stolenTokenName!,
          stolenTokenAddress,
          stolenTokenId,
          stolenTokenValue,
          stolenTokenDecimals
            ? victims[victimAddress].totalUsdValueAcrossAllErc20Tokens!
            : victims[victimAddress].totalUsdValueAcrossAllErc721Tokens!,
          exploitTxnHash,
          stolenTokenDecimals ? true : false,
          stolenTokenDecimals ? stolenTokenUsdValue! : nftCollectionFloorPrice!,
          icePhishingTransferTimeWindowInDays,
          victims[victimAddress].scammedBy![scammerAddress].totalUsdValueLostToScammer
        )
      );
      victims[victimAddress].scammedBy[scammerAddress].hasBeenAlerted = true;
    }
  }
  if (fpAlerted) {
    console.log("Deleting FP scammer from state: ", scammerAddress);
    delete scammers[scammerAddress];
  }
  return findings;
}
