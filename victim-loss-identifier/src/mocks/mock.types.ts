import { BigNumber } from "ethers";

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

export type MockTxnReceipt = {
  logs: [
    {
      address: string;
      topics: [string, string, string, string];
    },
  ];
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
  stolenTokenId: string;
  txnValue: BigNumber;
  blockNumber: number;
};
