type GeneralTokenInfo = {
  tokenName: string;
  tokenSymbol: string;
  tokenTotalUsdValue?: number;
};

type Erc20Info = GeneralTokenInfo & {
  tokenDecimal: number;
  tokenAmount: number;
};

type Erc721Info = GeneralTokenInfo & {
  tokenIds?: number[];
};

type Erc1155Info = GeneralTokenInfo & {
  tokenIds: { [key: number]: number }; // key: tokenId, value: tokenId amount
};

// key(s): token contract address
type TransactionInfo = {
  erc20?: { [key: string]: Erc20Info };
  erc721?: { [key: string]: Erc721Info };
  erc1155?: { [key: string]: Erc1155Info };
};

type ScammedByInfo = {
  totalUsdValueLostToScammer: number;
  transactions: {
    [key: string]: TransactionInfo; // key: transaction hash
  };
};

export type VictimInfo = {
  totalUsdValueAcrossAllTokens?: number;
  totalUsdValueAcrossAllErc20Tokens?: number;
  totalUsdValueAcrossAllErc721Tokens?: number;
  totalUsdValueAcrossAllErc1155Tokens?: number;
  scammedBy: {
    [key: string]: ScammedByInfo; // key: scammer address
  };
};

export type ScammerInfo = {
  mostRecentActivityByBlockNumber: number;
  firstAlertIdAppearance: string;
  totalUsdValueStolen: number;
  victims?: {
    [key: string]: VictimInfo; // key: victim address
  };
};

export type Erc721Transfer = {
  block_time: string;
  contract_address: string;
  from_address?: string;
  name: string;
  symbol: string;
  to_address: string;
  token_id: string;
  transaction_hash: string;
};

export type ApiKeys = {
  generalApiKeys: {
    ZETTABLOCK: string[];
  };
  apiKeys: {
    victimLoss: {
      alchemyApiKey: string;
      etherscanApiKeys: string[];
      optimisticEtherscanApiKeys: string[];
      bscscanApiKeys: string[];
      polygonscanApiKeys: string[];
      fantomscanApiKeys: string[];
      arbiscanApiKeys: string[];
      snowtraceApiKeys: string[];
    };
  };
};

export type CoinData = {
  coins: {
    "coingecko:ethereum": {
      price: number;
    };
  };
};

export type FpTransaction = {
  txHash: string;
  nfts: string[];
};
