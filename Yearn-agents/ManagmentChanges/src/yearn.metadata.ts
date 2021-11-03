import { AbiItem } from "web3-utils";

export const yearnDataProvider = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";

export const helperAbi = ["function assetsAddresses() view returns (address[])"];

export const vaultAbi = [
  "function setManagement(address vault)",
  "function governance() view returns(address)",
  "function setManagementFee(uint256 fee)",
  "function setPerformanceFee(uint256 fee)",
  "function setGovernance(address governor)",
  "function acceptGovernance()",
  "function pendingGovernance() view returns (address)",
];

export const multicallAbi = ["function aggregate(tuple(address,bytes)[] calls) returns (uint256, bytes[])"];
