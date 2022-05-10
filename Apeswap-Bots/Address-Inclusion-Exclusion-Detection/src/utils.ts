import { Finding, FindingSeverity, FindingType, ethers } from "forta-agent";

type tokenType = {
  address: string;
  name: string;
};

const APESWAP_GNANA: tokenType = {
  address: "0xdDb3Bd8645775F59496c821E4F55A7eA6A6dc299",
  name: "GOLDEN BANANA",
};

const includeAndExcludeFunctions: string[] = [
  "function excludeAccount(address account)",
  "function includeAccount(address account)",
];

type functionDetails = {
  args: ethers.utils.Result;
  name: string;
};

const createFinding = (account: string, name: string, tokenInfo: tokenType): Finding => {
  switch (name) {
    case "excludeAccount":
      return Finding.fromObject({
        name: "New Address exclusion",
        description: `${name} function call detected from ${tokenInfo.name} contract`,
        alertId: "APESWAP-2-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          "token Address": tokenInfo.address,
          "excluded Address": account,
        },
      });
    default:
      return Finding.fromObject({
        name: "New Address inclusion",
        description: `${name} function call detected from ${tokenInfo.name} contract`,
        alertId: "APESWAP-2-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          "token Address": tokenInfo.address,
          "included Address": account,
        },
      });
  }
};

export { tokenType, APESWAP_GNANA, includeAndExcludeFunctions, createFinding, functionDetails };
