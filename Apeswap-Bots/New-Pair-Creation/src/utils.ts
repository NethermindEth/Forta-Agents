import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { APEFACTORY_ABI } from "./constants";

const { CREATE_PAIR_FUNCTION, APEFACTORY_ADDRESS } = APEFACTORY_ABI;

// finding type definition
type newPairFindingType = {
  tokenAAddress: string;
  tokenBAddress: string;
};

type newPairParamsType = {
  functionSig: string;
  address: string;
};

const providerParams: newPairParamsType = {
  functionSig: CREATE_PAIR_FUNCTION,
  address: APEFACTORY_ADDRESS,
};

const createFinding = (findingMetadata: newPairFindingType, functionAbi: string): Finding => {
  const findingResult = {
    name: "New pair creation on ApeFactory contract",
    description: `${functionAbi} call detected on ApeFactory contract upon creation of new tradable pairs`,
    alertId: "APESWAP-8",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: findingMetadata,
  };

  return Finding.fromObject(findingResult);
};

export { createFinding, newPairFindingType, newPairParamsType, providerParams };
