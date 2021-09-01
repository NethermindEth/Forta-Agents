import Web3 from "web3";

const web3 = new Web3();

export type StrategyParams = {
  performanceFee: bigint;
  activation: bigint;
  debtRatio: bigint;
  minDebtPerHarvest: bigint;
  maxDebtPerHarvest: bigint;
  lastReport: bigint;
  totalDebt: bigint;
  totalGain: bigint;
  totalLoss: bigint;
};

export const createTxDataStrategiesCall = (strategyAddress: string): string => {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "strategies",
      type: "function",
      inputs: [
        {
          type: "address",
          name: "",
        },
      ],
    },
    [strategyAddress]
  );
};

export const createTxDataVaultCall = (): string => {
  return web3.eth.abi.encodeEventSignature("vault()");
};

export const createTxDataMaxReportDelayCall = (): string => {
  return web3.eth.abi.encodeEventSignature("maxReportDelay()");
};

export const decodeReturnStrategies = (returnValue: string): StrategyParams => {
  return web3.eth.abi.decodeParameter(
    {
      StrategyParams: {
        performanceFee: "uint256",
        activation: "uint256",
        debtRatio: "uint256",
        minDebtPerHarvest: "uint256",
        maxDebtPerHarvest: "uint256",
        lastReport: "uint256",
        totalDebt: "uint256",
        totalGain: "uint256",
        totalLoss: "uint256",
      },
    },
    returnValue
  ) as StrategyParams;
};

export const encodeStrategyParams = (
  strategyParams: StrategyParams
): string => {
  return web3.eth.abi.encodeParameter(
      {
        "StrategyParams": {
            performanceFee: "uint256",
            activation: "uint256",
            debtRatio: "uint256",
            minDebtPerHarvest: "uint256",
            maxDebtPerHarvest: "uint256",
            lastReport: "uint256",
            totalDebt: "uint256",
            totalGain: "uint256",
            totalLoss: "uint256",
        }
      }, strategyParams
    );
};
