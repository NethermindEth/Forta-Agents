import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { FindingGenerator, decodeParameter } from "forta-agent-tools";
import Web3 from "web3";

export const updateManagementSignature = "UpdateManagement(address)";

export const updateManagementFeeSignature = "UpdateManagementFee(uint256)";

export const updatePerformanceFeeSignature = "UpdatePerformanceFee(uint256)";

export const createUpdateManagementFindingGenerator = (vaultAddress: string): FindingGenerator => {
  return (metadata) => {
    const setManager = decodeParameter("address", metadata?.data);

    return Finding.fromObject({
      name: "Updated Management",
      description: "A Yearn Vault has updated its manager",
      alertId: "Yearn-9-1",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      metadata: {
        vaultAddress: vaultAddress,
        setManger: setManager,
      },
    });
  };
};

export const createUpdateManagementFeeFindingGenerator = (vaultAddress: string): FindingGenerator => {
  return (metadata) => {
    const setFee = decodeParameter("uint256", metadata?.data);

    return Finding.fromObject({
      name: "Updated Management Fee",
      description: "A Yearn Vault has updated its management fee",
      alertId: "Yearn-9-1",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      metadata: {
        vaultAddress: vaultAddress,
        setFee: setFee.toString(),
      },
    });
  };
};

export const createUpdatePerformanceFeeFindingGenerator = (vaultAddress: string): FindingGenerator => {
  return (metadata) => {
    const setFee = decodeParameter("uint256", metadata?.data);

    return Finding.fromObject({
      name: "Updated Performance Fee",
      description: "A Yearn Vault has updated its performance fee",
      alertId: "Yearn-9-1",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      metadata: {
        vaultAddress: vaultAddress,
        setFee: setFee.toString(),
      },
    });
  };
};

export const getYearnVaults = (web3: Web3, blockNumber: string | number): string[] => {

};
