import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (
  name: string,
  jToken: string,
  args: any[]
): Finding => {
  if (name === "Mint")
    return Finding.fromObject({
      name: "Large minted amount detected on BankerJoe",
      description: `${name} event detected on a jToken contract with a large amount`,
      protocol: "TraderJoe",
      alertId: "TRADERJOE-21-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        minter: args[0].toLowerCase(),
        mintAmount: args[1].toString(),
        mintTokens: args[2].toString(),
      },
      addresses: [jToken],
    });
  else {
    if (name === "Redeem")
      return Finding.fromObject({
        name: "Large redeemed amount detected on BankerJoe",
        description: `${name} event detected on a jToken contract with a large amount`,
        protocol: "TraderJoe",
        alertId: "TRADERJOE-21-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          redeemer: args[0].toLowerCase(),
          redeemAmount: args[1].toString(),
          redeemTokens: args[2].toString(),
        },
        addresses: [jToken],
      });
    else
      return Finding.fromObject({
        name: "Large borrowed amount detected on BankerJoe",
        description: `${name} event detected on a jToken contract with a large amount`,
        protocol: "TraderJoe",
        alertId: "TRADERJOE-21-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          borrower: args[0].toLowerCase(),
          borrowAmount: args[1].toString(),
          accountBorrows: args[2].toString(),
          totalBorrows: args[3].toString(),
        },
        addresses: [jToken],
      });
  }
};
