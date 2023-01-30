export const EOA_TRANSACTION_COUNT_THRESHOLD = 100;
export const CONTRACT_TRANSACTION_COUNT_THRESHOLD = 500;

interface etherscanApisInterface {
  [key: number]: {
    urlContract: string;
    urlAccount: string;
    urlContractCreation: string;
  };
}

export const etherscanApis: etherscanApisInterface = {
  1: {
    urlContract: "https://api.etherscan.io/api?module=contract&action=getabi",
    urlAccount: "https://api.etherscan.io/api?module=account&action=txlist",
    urlContractCreation: "https://api.etherscan.io/api?module=contract&action=getcontractcreation",
  },
  10: {
    urlContract: "https://api-optimistic.etherscan.io/api?module=contract&action=getabi",
    urlAccount: "https://api-optimistic.etherscan.io/api?module=account&action=txlist",
    urlContractCreation: "https://api-optimistic.etherscan.io/api?module=contract&action=getcontractcreation",
  },
  56: {
    urlContract: "https://api.bscscan.com/api?module=contract&action=getabi",
    urlAccount: "https://api.bscscan.com/api?module=account&action=txlist",
    urlContractCreation: "https://api.bscscan.com/api?module=contract&action=getcontractcreation",
  },
  137: {
    urlContract: "https://api.polygonscan.com/api?module=contract&action=getabi",
    urlAccount: "https://api.polygonscan.com/api?module=account&action=txlist",
    urlContractCreation: "https://api.polygonscan.com/api?module=contract&action=getcontractcreation",
  },
  250: {
    urlContract: "https://api.ftmscan.com/api?module=contract&action=getabi",
    urlAccount: "https://api.ftmscan.com/api?module=account&action=txlist",
    urlContractCreation: "https://api.ftmscan.com/api?module=contract&action=getcontractcreation",
  },
  42161: {
    urlContract: "https://api.arbiscan.io/api?module=contract&action=getabi",
    urlAccount: "https://api.arbiscan.io/api?module=account&action=txlist",
    urlContractCreation: "https://api.arbiscan.io/api?module=contract&action=getcontractcreation",
  },
  43114: {
    urlContract: "https://api.snowtrace.io/api?module=contract&action=getabi",
    urlAccount: "https://api.snowtrace.io/api?module=account&action=txlist",
    urlContractCreation: "https://api.snowtrace.io/api?module=contract&action=getcontractcreation",
  },
};
