import { BigNumber } from "ethers";

// Fraudulent NFT Order
export type MockErc721Transfer = {
  block_time: string;
  contract_address: string;
  from_address: string;
  name: string;
  symbol: string;
  to_address: string;
  token_id: string;
  transaction_hash: string;
};

export type MockIcePhishingTransfer = {
  transaction_hash: string;
  contract_address: string;
  from_address: string;
  to_address: string;
  symbol: string;
  name: string | null;
  token_id: string | null;
  decimals: number | null;
  value: string | null;
  block_time: string;
  block_number: number;
};

type Log = {
  address: string;
  topics: [string, string, string, string];
};

export type MockTxnReceipt = {
  logs: Log[];
};

export type MockTxnResponse = {
  to: string;
  value: BigNumber;
  blockNumber: number;
};

export type MockExploitInfo = {
  exploitTxnHash: string;
  fromAddress: string;
  victimAddress: string;
  stolenTokenAddress: string;
  stolenTokenName: string;
  stolenTokenSymbol: string;
  stolenTokenId: string | null;
  stolenTokenDecimals: number | null;
  stolenTokenAmount: string | null;
  txnValue: BigNumber;
  blockNumber: number;
};
