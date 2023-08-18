type GeneralTokenInfo = {
  tokenName: string;
  tokenSymbol: string;
  tokenTotalUsdValue?: number;
};

type Erc721Info = GeneralTokenInfo & {
  tokenIds: number[];
};

type TransactionInfo = {
  erc721: { [key: string]: Erc721Info };
};

export type ScammerInfo = {
  mostRecentActivityByBlockNumber: number;
  victims: {
    [key: string]: {
      [key: string]: TransactionInfo;
    };
  };
};
