import { Result } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, token: string, args: Result): Finding => {
  if (name === "LogDeposit")
    return Finding.fromObject({
      name: "Large deposit into perpetual contract",
      description: "LogDeposit event detected with large quantized Amount",
      alertId: "DYDX-1-1",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args.quantizedAmount.toString(),
        starkKey: args.starkKey.toHexString(),
        token: token,
      },
    });
  else if (name === "LogWithdrawalPerformed")
    return Finding.fromObject({
      name: "Large withdrawal into perpetual contract",
      description: "LogWithdrawalPerformed event detected with large quantized Amount",
      alertId: "DYDX-1-2",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args.quantizedAmount.toString(),
        token: token,
        recipient: args.recipient.toLowerCase(),
        ownerKey: args.ownerKey.toHexString(),
      },
    });
  else
    return Finding.fromObject({
      name: "Large mint withdrawal into perpetual contract",
      description: "LogMintWithdrawalPerformed event detected with large quantized Amount",
      alertId: "DYDX-1-3",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        quantizedAmount: args.quantizedAmount.toString(),
        token: token,
        assetId: args.assetId.toString(),
        ownerKey: args.ownerKey.toHexString(),
      },
    });
};
