import BigNumber from "bignumber.js";
import { Finding, FindingSeverity, ethers, FindingType } from "forta-agent";

export function ethersBnToBn(value: ethers.BigNumber, decimals: number): BigNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals);
}

export const createFinding = (
  account: string,
  vaultAddress: string,
  updateKey: string,
  increaseKey: string,
  size: ethers.BigNumber,
  sizeDelta: ethers.BigNumber,
  positionSizeDifference: ethers.BigNumber
): Finding => {
  if (size.eq(sizeDelta)) {
    return Finding.fromObject({
      name: "Large position size opened on GMX's Vault Contract",
      description: "UpdatePosition event emitted with a large position size",
      alertId: "GMX-1-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "GMX",
      metadata: {
        gmxVault: vaultAddress,
        account: account,
        positionSize: ethersBnToBn(size, 30).decimalPlaces(2).toString(),
        positionKey: updateKey,
      },
    });
  } else
    return Finding.fromObject({
      name: "Existing large position increased on GMX's Vault Contract",
      description: "IncreasePosition event emitted in an existing large position on GMX's Vault Contract",
      alertId: "GMX-1-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "GMX",
      metadata: {
        gmxVault: vaultAddress,
        account: account,
        initialPositionSize: ethersBnToBn(positionSizeDifference, 30).decimalPlaces(2).toString(10),
        positionIncrementSize: ethersBnToBn(sizeDelta, 30).decimalPlaces(2).toString(10),
        finalPositionSize: ethersBnToBn(size, 30).decimalPlaces(2).toString(10),
        positionKey: increaseKey,
      },
    });
};
