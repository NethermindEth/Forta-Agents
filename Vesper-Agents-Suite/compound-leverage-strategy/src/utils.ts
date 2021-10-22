import { strategyABI, comptrollerABI } from "./abi";
import Web3 from "web3";
import { decodeParameter } from "forta-agent-tools";

const comptrollerAddress = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";

export const getCurrentBorrowRatio = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<bigint> => {
  const strategyContract = new web3.eth.Contract(strategyABI, contractAddress);
  const currentBorrowRatio = await strategyContract.methods
    .currentBorrowRatio()
    .call(blockNumber);
  return BigInt(currentBorrowRatio);
};

export const getScaledCurrentBorrowRatio = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<bigint> => {
  const currentBorrowRatio = await getCurrentBorrowRatio(
    web3,
    contractAddress,
    blockNumber
  );
  return currentBorrowRatio * BigInt(10e14);
};

export const getMaxBorrowRatio = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<BigInt> => {
  const strategyContract = new web3.eth.Contract(strategyABI, contractAddress);
  const { maxBorrowRatio } = await strategyContract.methods
    .borrowRatioRange()
    .call(blockNumber);
  return BigInt(maxBorrowRatio);
};

export const getRelatedCToken = async (
  web3: Web3,
  contractAddress: string,
  blockNumber: string | number
): Promise<string> => {
  return decodeParameter(
    "address",
    await web3.eth.getStorageAt(contractAddress, 11, blockNumber)
  );
};

export const getCollateralFactorMantissa = async (
  web3: Web3,
  cToken: string,
  blockNumber: string | number
): Promise<bigint> => {
  const comptrollerContract = new web3.eth.Contract(
    comptrollerABI,
    comptrollerAddress
  );
  const { collateralFactorMantissa } = await comptrollerContract.methods
    .markets(cToken)
    .call(blockNumber);
  return BigInt(collateralFactorMantissa);
};
