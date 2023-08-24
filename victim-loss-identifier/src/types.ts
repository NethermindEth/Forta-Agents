export type apiKeys = {
  generalApiKeys: {
    ZETTABLOCK: string[];
  };
};

export type Erc721Transfer = {
  block_time: string;
  contract_address: string;
  from_address: string;
  name: string;
  symbol: string;
  to_address: string;
  token_id: string;
  transaction_hash: string;
};
