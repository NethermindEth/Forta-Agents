export const MONITORED_EVENTS = [
  "event LivenessSet(uint256 newLiveness)",
  "event ProtocolFeeCaptureSet(address indexed newProtocolFeeCaptureAddress, uint256 indexed newProtocolFeeCapturePct)",
  "event ProtocolFeesCapturedClaimed(address indexed l1Token, uint256 indexed accumulatedFees)", // probably irrelevant
  "event BondSet(address indexed newBondToken, uint256 newBondAmount)",
  "event IdentifierSet(bytes32 newIdentifier)",
  "event CrossChainContractsSet(uint256 l2ChainId, address adapter, address spokePool)",
  "event L1TokenEnabledForLiquidityProvision(address l1Token, address lpToken)",
  "event L2TokenDisabledForLiquidityProvision(address l1Token, address lpToken)",
  "event SetPoolRebalanceRoute(uint256 indexed destinationChainId, address indexed l1Token, address indexed destinationToken)",
  "event SetEnableDepositRoute(uint256 indexed originChainId, uint256 indexed destinationChainId, address indexed originToken, bool depositsEnabled)",
  "event SpokePoolAdminFunctionTriggered(uint256 indexed chainId, bytes message)",
];

export function generateDictNameToAbi(monitoredEvents: string[]) {
  let res: Dictionary<string> = {};
  for (let i = 0; i < monitoredEvents.length; i++) {
    let name: string = monitoredEvents[i].split("(")[0].split(" ")[1];
    res[name] = monitoredEvents[i];
  }
  return res;
}

function eventToParamNames(eventAbi: string) {
  eventAbi = eventAbi.substring(6).split(")")[0];
  eventAbi = eventAbi.substring(6).split("(")[1];
  let params: string[] = eventAbi.split(",");
  let paramNames: string[] = [];
  for (let i = 0; i < params.length; i++) {
    let param: string[] = params[i].split(" ");
    let paramName = param[param.length - 1];
    paramNames.push(paramName);
  }
  return paramNames;
}

interface Dictionary<T> {
  [Key: string]: T;
}

export function getEventMetadata(eventName: string, paramValues: any, eventNameToAbi: {}) {
  let eventAbi = eventNameToAbi[eventName as keyof typeof eventNameToAbi];
  return getEventMetadataFromAbi(eventAbi, paramValues);
}

export function getEventMetadataFromAbi(eventAbi: string, paramValues: any[]) {
  let paramNames: string[] = eventToParamNames(eventAbi);
  let metadataDict: Dictionary<string> = {};
  for (let i = 0; i < paramNames.length; i++) {
    let paramName: string = paramNames[i];
    metadataDict[paramName] = paramValues[i].toString();
  }

  return metadataDict;
}
