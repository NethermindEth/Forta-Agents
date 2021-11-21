import { ethers, BigNumber } from "ethers";
import { helperInterface, vaultInterface } from "./abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";


const BLOCKS_LAPSE = 265; // 1 hour aproximately

export type Provider = ethers.providers.JsonRpcProvider;

const YEARN_HELPER_ADDRESS = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";

export type LastBlockReports = Record<string, number>;

export const createFinding = (
  yearnVault: string,
  depositLimit: string,
  totalAssets: string,
): Finding => {
  return Finding.fromObject({
    name: "Yearn Vault Deposit Limit",
    description: "Yearn Vault close to deposit limit",
    alertId: "Yearn-4",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      YearnVault: yearnVault,
      DespositLimit: depositLimit.toString(),
      TotalAssets: totalAssets.toString(),
    },
  });
};

export const getYearnVaults = async (
  blockNumber: number,
  ethersProvider: Provider
): Promise<string[]> => {
  const yearnHelper = new ethers.Contract(
    YEARN_HELPER_ADDRESS,
    helperInterface,
    ethersProvider
  );
  return yearnHelper.assetsAddresses({ blockTag: blockNumber });
};

export const getTotalAssets = async (
  yearnVaultAddress: string,
  blockNumber: number,
  ethersProvider: Provider
): Promise<BigNumber> => {
  const yearnVault = new ethers.Contract(
    yearnVaultAddress,
    vaultInterface,
    ethersProvider
  );
  return yearnVault.totalAssets({ blockTag: blockNumber });
};

export const getDepositLimit = async (
  yearnVaultAddress: string,
  blockNumber: number,
  ethersProvider: Provider
): Promise<BigNumber> => {
  const yearnVault = new ethers.Contract(
    yearnVaultAddress,
    vaultInterface,
    ethersProvider
  );
  return yearnVault.depositLimit({ blockTag: blockNumber });
};

export const shouldReport = (
  vault: string,
  utilizationPercent: BigNumber,
  lastBlockReports: LastBlockReports,
  blockNumber: number
): boolean => {
  const lastBlockReport = lastBlockReports[vault];
  
  if (lastBlockReport !== undefined && blockNumber < lastBlockReport) {
    return false;
  }

  if (utilizationPercent.lt(90)) {
    delete lastBlockReports[vault];
    return false;
  }

  if (
    lastBlockReport === undefined ||
    lastBlockReport + BLOCKS_LAPSE < blockNumber
  ) {
    lastBlockReports[vault] = blockNumber;
    return true;
  }
  return false;
};;
