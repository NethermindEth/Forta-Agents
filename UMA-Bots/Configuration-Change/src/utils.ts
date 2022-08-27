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
];

export const SPOKEPOOL_MONITORED_EVENTS = [
  "event SetXDomainAdmin(address indexed newAdmin)",
  "event SetHubPool(address indexed newHubPool)",
  "event EnabledDepositRoute(address indexed originToken, uint256 indexed destinationChainId, bool enabled)",
  "event SetDepositQuoteTimeBuffer(uint32 newBuffer)",
];

export const ARB_SPOKEPOOL_MONITORED_EVENTS = SPOKEPOOL_MONITORED_EVENTS.concat([
  "event SetL2GatewayRouter(address indexed newL2GatewayRouter)",
  "event WhitelistedTokens(address indexed l2Token, address indexed l1Token)",
]);
export const OP_SPOKEPOOL_MONITORED_EVENTS = SPOKEPOOL_MONITORED_EVENTS.concat([
  "event SetL1Gas(uint32 indexed newL1Gas)",
  "event SetL2TokenBridge(address indexed l2Token, address indexed tokenBridge)",
]);

export const POLYGON_SPOKEPOOL_MONITORED_EVENTS = SPOKEPOOL_MONITORED_EVENTS.concat([
  "event SetFxChild(address indexed newFxChild)",
  "event SetPolygonTokenBridger(address indexed polygonTokenBridger)",
]);

interface Dictionary<T> {
  [Key: string]: T;
}

/*
 * @desc Returns the metadata to be returned in a finding when passed an event ABI (used in tests)
 * @param eventAbi - ABI for the event
 * @param paramValues - values for each of the parameters in the event
 * @return the metadata dictionary with parameter names as keys and the passed values as values
 */
export function getEventMetadataFromAbi(eventAbi: string, paramValues: any[]) {
  const metadataDict: Dictionary<any> = {};
  const argsDict: Dictionary<string> = {};
  const params: string[] = eventAbi
    .substring(0, eventAbi.length - 1)
    .substring(6)
    .split("(")[1]
    .split(",");
  let index = 0;
  params.forEach((param) => {
    const paramName = param.split(" ")[param.split(" ").length - 1];
    argsDict[paramName] = paramValues[index++].toString();
  });
  metadataDict["event"] = eventAbi.split("(")[0].split(" ")[1];
  metadataDict["args"] = argsDict;
  return metadataDict;
}

export function getFindingInstance(hubPoolChange: boolean, eventArgs: {}) {
  return Finding.fromObject({
    name: "Configuration Changed",
    description: (hubPoolChange ? "HubPool" : "SpokePool") + " configuration changed",
    alertId: "UMA-5",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: eventArgs,
  });
}

export const getMetadata = (args: { [key: string]: string }) => {
  const metadata: { [key: string]: string } = {};
  const allKeys: string[] = Object.keys(args);
  const keys: string[] = allKeys.slice(allKeys.length / 2);
  keys.forEach((key) => {
    metadata[key] = args[key].toString();
  });
  return metadata;
};
