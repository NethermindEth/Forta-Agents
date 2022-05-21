import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber } from "ethers";
import { BANANA_CONSTANTS } from "./constants";

const { BANANA_MINT_FUNCTION } = BANANA_CONSTANTS;

export type bananaFindingType = {
  from: string;
  to: string | undefined;
  value: string;
};

export const threshold: BigNumber = BigNumber.from(2); // 2 means totalSupply divided by 2

export type providerParamsType = string;
export const providerParams: providerParamsType = BANANA_MINT_FUNCTION;

export const createFinding = (findingMetadata: bananaFindingType): Finding => {
  return Finding.fromObject({
    name: "detect banana mint",
    description: `${findingMetadata.value} amount of banana mint detected`,
    alertId: "APESWAP-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      from: findingMetadata.from,
      to: findingMetadata.to || "",
      value: findingMetadata.value,
    },
  });
};
