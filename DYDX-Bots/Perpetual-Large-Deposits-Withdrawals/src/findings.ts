import { Result } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, token: string, args: Result): Finding => {
  if (name === "LogDeposit")
    return Finding.fromObject({
      name: "Large deposit into perpetual contract",
      description: "LogDeposit event detected with large quantizedAmount",
      alertId: "DYDX-1-1",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args.quantizedAmount.toString(),
        starkKey: args.starkKey.toHexString(),
        token: token.toLowerCase(),
      },
    });
  else if (name === "LogWithdrawalPerformed")
    return Finding.fromObject({
      name: "Large withdrawal into perpetual contract",
      description: "LogWithdrawalPerformed event detected with large quantizedAmount",
      alertId: "DYDX-1-2",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args.quantizedAmount.toString(),
        token: token.toLowerCase(),
        recipient: args.recipient.toLowerCase(),
        ownerKey: args.ownerKey.toHexString(),
      },
    });
  else
    return Finding.fromObject({
      name: "Large mint withdrawal into perpetual contract",
      description: "LogMintWithdrawalPerformed event detected with large quantizedAmount",
      alertId: "DYDX-1-3",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args.quantizedAmount.toString(),
        token: token.toLowerCase(),
        assetId: args.assetId.toString(),
        ownerKey: args.ownerKey.toHexString(),
      },
    });
};
export const createSuspiciousFinding = (name: string, assetType: string, args: Result): Finding => {
  return Finding.fromObject({
    name: "Suspicious assetType detected on perpetual contract",
    description: `${name} event detected with an asset different from  the system asset`,
    alertId: "DYDX-1-4",
    protocol: "dYdX",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      quantizedAmount: args.quantizedAmount.toString(),
      starkKey: args.starkKey ? args.starkKey.toHexString() : args.ownerKey.toHexString(),
      assetType: assetType.toLowerCase(),
    },
  });
};
