interface etherscanApisInterface {
  [key: number]: {
    urlAccount: string;
    urlAccountInternalTxs: string;
    sourceCode: string;
  };
}

export const etherscanApis: etherscanApisInterface = {
  1: {
    urlAccount: "https://api.etherscan.io/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api.etherscan.io/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api.etherscan.io/api?module=contract&action=getsourcecode",
  },
  10: {
    urlAccount:
      "https://api-optimistic.etherscan.io/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api-optimistic.etherscan.io/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode",
  },
  56: {
    urlAccount: "https://api.bscscan.com/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api.bscscan.com/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api.bscscan.com/api?module=contract&action=getsourcecode",
  },
  137: {
    urlAccount: "https://api.polygonscan.com/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api.polygonscan.com/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api.polygonscan.com/api?module=contract&action=getsourcecode",
  },
  250: {
    urlAccount: "https://api.ftmscan.com/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api.ftmscan.com/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api.ftmscan.com/api?module=contract&action=getsourcecode",
  },
  42161: {
    urlAccount: "https://api.arbiscan.io/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api.arbiscan.io/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api.arbiscan.io/api?module=contract&action=getsourcecode",
  },
  43114: {
    urlAccount: "https://api.snowtrace.io/api?module=account&action=txlist",
    urlAccountInternalTxs:
      "https://api.snowtrace.io/api?module=account&action=txlistinternal",
    sourceCode:
      "https://api.snowtrace.io/api?module=contract&action=getsourcecode",
  },
};
