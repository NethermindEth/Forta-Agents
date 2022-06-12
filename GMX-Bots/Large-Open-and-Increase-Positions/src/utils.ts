import BigNumber from "bignumber.js";
import { Finding, FindingSeverity, ethers, FindingType } from "forta-agent";

export function ethersBnToBn(value: ethers.BigNumber, decimals: number): BigNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals);
}

export const createFinding = (
  account: string,
  vaultAddress: string,
  updatePositionKey: string,
  increasePositionKey: string,
  positionSize: ethers.BigNumber,
  positionSizeDelta: ethers.BigNumber,
  positionSizeDifference: ethers.BigNumber
): Finding => {
  if (updatePositionKey === increasePositionKey && ethers.BigNumber.from(positionSize).eq(positionSizeDelta)) {
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
        positionSize: ethersBnToBn(positionSizeDelta, 30).decimalPlaces(2).toString(),
        positionKey: updatePositionKey,
      },
    });
  } else {
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
        initialPositionSize: ethersBnToBn(positionSizeDelta, 30).decimalPlaces(2).toString(),
        positionIncrementSize: ethersBnToBn(positionSizeDifference, 30).decimalPlaces(2).toString(),
        finalPositionSize: ethersBnToBn(positionSize, 30).decimalPlaces(2).toString(),
        positionKey: increasePositionKey,
      },
    });
  }
};
