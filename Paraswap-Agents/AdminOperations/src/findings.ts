import { LogDescription, TransactionDescription } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createEventFinding = (log: LogDescription) => {
  let name = log.name == "RouterInitialized" ? "Router" : "Adapter";
  return Finding.fromObject({
    name: `Admin operation detected: ${name} has been initialized`,
    description: `${log.name} event was emitted in AugustusSwapper contract`,
    alertId: "PARASWAP-1-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Paraswap",
    metadata: {
      address: log.args.router ? log.args.router.toLowerCase() : log.args.adapter.toLowerCase(),
    },
  });
};

export const createFunctionFinding = (call: TransactionDescription) => {
  switch (call.name) {
    case "transferTokens":
      return Finding.fromObject({
        name: `Admin operation detected: tokens were transfered`,
        description: `${call.name} function was called and a Transfer event was emitted in AugustusSwapper contract`,
        alertId: "PARASWAP-1-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          token: call.args.token.toLowerCase(),
          destination: call.args.destination.toLowerCase(),
          amount: call.args.amount.toString(),
        },
      });

    case "setImplementation":
      return Finding.fromObject({
        name: `Admin operation detected: Implementation upgraded`,
        description: `${call.name} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          selector: call.args.selector.toLowerCase(),
          implementation: call.args.implementation.toLowerCase(),
        },
      });

    case "registerPartner":
      return Finding.fromObject({
        name: `Admin operation detected: new Partner registred`,
        description: `${call.name} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-4",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          partner: call.args.partner.toLowerCase(),
          partnerShare: call.args._partnerShare.toString(),
          noPositiveSlippage: call.args._noPositiveSlippage,
          positiveSlippageToUser: call.args._positiveSlippageToUser,
          feePercent: call.args._feePercent.toString(),
        },
      });

    default:
      // "setFeeWallet"
      return Finding.fromObject({
        name: `Admin operation detected: Fee Wallet address changed`,
        description: `${call.name} function was called in AugustusSwapper contract`,
        alertId: "PARASWAP-1-5",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Paraswap",
        metadata: {
          new_address: call.args._feeWallet.toLowerCase(),
        },
      });
  }
};
