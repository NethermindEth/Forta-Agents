import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { keccak256 } from "@ethersproject/keccak256";
import NetworkData from "./network";
import { getCreate2Address } from "@ethersproject/address";

import { APEFACTORY_ABI } from "./constants";

const { CREATE_PAIR_FUNCTION } = APEFACTORY_ABI;

// finding type definition
type newPairFindingType = {
  tokenAAddress: string;
  tokenBAddress: string;
  pairAddress: string;
};

type newPairParamsType = {
  functionAbi: string;
};

const providerParams: newPairParamsType = {
  functionAbi: CREATE_PAIR_FUNCTION,
};

const apePairCreate2 = (token0: string, token1: string, networkData: NetworkData) => {
  const salt: string = keccak256(token0.concat(token1.slice(2)));
  return getCreate2Address(networkData.apeFactoryAddress, salt, networkData.apeFactoryInitCodeHash).toLowerCase();
};

const createFinding = (findingMetadata: newPairFindingType): Finding => {
  const findingResult = {
    name: "New pair creation on ApeFactory contract",
    description: "New pair creation call detected on ApeFactory contract",
    alertId: "APESWAP-8",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: findingMetadata,
  };

  return Finding.fromObject(findingResult);
};

export { createFinding, newPairFindingType, newPairParamsType, providerParams, apePairCreate2 };
