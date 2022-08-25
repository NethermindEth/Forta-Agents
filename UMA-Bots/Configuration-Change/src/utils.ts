import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const HUBPOOL_MONITORED_EVENTS = [
  "event LivenessSet(uint256 newLiveness)",
  "event ProtocolFeeCaptureSet(address indexed newProtocolFeeCaptureAddress, uint256 indexed newProtocolFeeCapturePct)",
  "event Paused(bool indexed isPaused)",
  "event BondSet(address indexed newBondToken, uint256 newBondAmount)",
  "event IdentifierSet(bytes32 newIdentifier)",
  "event CrossChainContractsSet(uint256 l2ChainId, address adapter, address spokePool)",
  "event L1TokenEnabledForLiquidityProvision(address l1Token, address lpToken)",
  "event L2TokenDisabledForLiquidityProvision(address l1Token, address lpToken)",
  "event SetPoolRebalanceRoute(uint256 indexed destinationChainId, address indexed l1Token, address indexed destinationToken)",
  "event SetEnableDepositRoute(uint256 indexed originChainId, uint256 indexed destinationChainId, address indexed originToken, bool depositsEnabled)",
  "event SpokePoolAdminFunctionTriggered(uint256 indexed chainId, bytes message)", // not exactly a configuration @Review
];

export const SPOKEPOOL_MONITORED_EVENTS = [
  "event SetXDomainAdmin(address indexed newAdmin)",
  "event SetHubPool(address indexed newHubPool)",
  "event EnabledDepositRoute(address indexed originToken, uint256 indexed destinationChainId, bool enabled)",
  "event SetDepositQuoteTimeBuffer(uint32 newBuffer)",
];

/*
 * @desc Generates a dictionary from event name to the complete ABI of the event
 * @dev For e.g. {"LivenessSet" : "event LivenessSet(uint256 newLiveness)"}
 */
export function generateDictNameToAbi(monitoredEvents: string[]) {
  let res: Dictionary<string> = {};
  for (let i = 0; i < monitoredEvents.length; i++) {
    let name: string = monitoredEvents[i].split("(")[0].split(" ")[1];
    res[name] = monitoredEvents[i];
  }
  return res;
}

/*
 * @desc Returns the list of parameters for an event if provided the event ABI
 * @dev For e.g. if input is ""event BondSet(address indexed newBondToken, uint256 newBondAmount)"
 * @dev The output will be ["newBondToken","newBondAmount"]
 */
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

/*
 * @desc Returns the metadata to be returned in a finding
 * @param eventAbi - ABI for the event
 * @param paramValues - values for each of the parameters in the event
 * @return the metadata dictionary with parameter names as keys and the passed values as values
 */
export function getEventMetadataFromAbi(eventAbi: string, paramValues: any[]) {
  let paramNames: string[] = eventToParamNames(eventAbi);
  let metadataDict: Dictionary<string> = {};
  metadataDict["event"] = eventAbi.split("(")[0].split(" ")[1];
  for (let i = 0; i < paramNames.length; i++) {
    let paramName: string = paramNames[i];
    metadataDict[paramName] = paramValues[i].toString();
  }

  return metadataDict;
}

export function getFindingInstance(hubPoolChange: boolean, eventArgs: {}) {
  return Finding.fromObject({
    name: "Configuration Changed",
    description: (hubPoolChange ? "HubPool" : "SpokePool") + " configuration changed",
    alertId: "UMA-3",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: eventArgs,
  });
}
