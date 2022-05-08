import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { APEFACTORY_ABI } from "./constants";

const { CREATE_PAIR_FUNCTION, APEFACTORY_ADDRESS } = APEFACTORY_ABI;

// finding type definition
type newPairFindingType = {
  tokenAAddress: string;
  tokenBAddress: string;
};

type newPairParamsType = {
  createFunctionSig: string;
  address: string;
};

const providerParams: newPairParamsType = {
  address: APEFACTORY_ADDRESS,
  createFunctionSig: CREATE_PAIR_FUNCTION,
};

const createFinding = (findingMetadata: newPairFindingType): Finding => {
  const findingResult = {
    name: "new pair creation detection bot",
    description: `Detect the creation of new tradable pairs on Apeswap`,
    alertId: "APESWAP-8",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: findingMetadata,
  };

  return Finding.fromObject(findingResult);
};

export { createFinding, newPairFindingType, newPairParamsType, providerParams };
