import { utils, BigNumber } from "ethers";
import { MockErc721Transfer, MockTxnReceipt, MockTxnResponse } from "./mock.types";

export function createTxnReceipt(tokenAddress: string, victimAddress: string, tokenId: string): MockTxnReceipt {
  return {
    logs: [
      {
        address: tokenAddress,
        topics: [
          utils.id("Transfer(address,address,uint256)"),
          utils.hexZeroPad(utils.hexValue(victimAddress), 32),
          "mock to",
          utils.hexZeroPad(utils.hexValue(Number(tokenId)), 32),
        ],
      },
    ],
  };
}

export function createTxnResponse(
  nftMarketPlaceAddress: string,
  txnValue: BigNumber,
  timestamp: number
): MockTxnResponse {
  return {
    to: nftMarketPlaceAddress,
    value: txnValue,
    timestamp,
  };
}

export function createMockErc721Transfer(
  txnHash: string,
  fromAddress: string,
  tokenAddress: string,
  tokenName: string,
  tokenSymbol: string,
  tokenId: string
): MockErc721Transfer {
  return {
    transaction_hash: txnHash,
    from_address: fromAddress,
    contract_address: tokenAddress,
    name: tokenName,
    symbol: tokenSymbol,
    token_id: tokenId,
    block_time: "block time",
    to_address: "to address",
  };
}
