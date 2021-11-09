import { ethers, BigNumber } from "ethers";
import { helperInterface, vaultInterface } from "./abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

const BLOCKS_LAPSE = 265; // 1 hour aproximately

export type Provider = ethers.providers.JsonRpcProvider;

export type LastBlockReports = Record<string, number>;

const YEARN_HELPER_ADDRESS = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";

export const createFinding = (
  yearnVault: string,
  idleFunds: string
): Finding => {
  return Finding.fromObject({
    name: "Yearn Vault idle funds",
    description: "Detects Yearn Vaults with too much idle funds",
    alertId: "Yearn-5",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Yearn",
    metadata: {
      YearnVault: yearnVault,
      IdleFundsPercent: idleFunds.toString(),
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

export const getTotalDebt = async (
  yearnVaultAddress: string,
  blockNumber: number,
  ethersProvider: Provider
): Promise<BigNumber> => {
  const yearnVault = new ethers.Contract(
    yearnVaultAddress,
    vaultInterface,
    ethersProvider
  );
  return yearnVault.totalDebt({ blockTag: blockNumber });
};

export const computeIdlePercent = (
  totalAssets: BigNumber,
  totalDebt: BigNumber
): BigNumber => {
  const debtPercent = totalDebt.mul(100).div(totalAssets);
  return BigNumber.from(100).sub(debtPercent);
};

export const shouldReport = (vault: string, idlePercent: BigNumber, lastBlockReports: LastBlockReports, blockNumber: number): boolean => {
  if (idlePercent.lt(25)) {
    delete lastBlockReports[vault];
    return false;
  }

  const lastBlockReport = lastBlockReports[vault];
  if (lastBlockReport === undefined || lastBlockReport + BLOCKS_LAPSE < blockNumber) {
    lastBlockReports[vault] = blockNumber;
    return true;
  }
  return false;
}
