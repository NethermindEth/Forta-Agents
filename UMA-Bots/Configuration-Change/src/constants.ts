export const DISPUTE_EVENT = "event RootBundleDisputed(address indexed disputer, uint256 requestTime)";
export const MONITORED_EVENTS = [
  "event LivenessSet(uint256 newLiveness)",
  "event ProtocolFeeCaptureSet(address indexed newProtocolFeeCaptureAddress, uint256 indexed newProtocolFeeCapturePct)",
  "event ProtocolFeesCapturedClaimed(address indexed l1Token, uint256 indexed accumulatedFees)",
  "event BondSet(address indexed newBondToken, uint256 newBondAmount)",
  "event LivenessSet(uint256 newLiveness)",
  "event IdentifierSet(bytes32 newIdentifier)",
  "event CrossChainContractsSet(uint256 l2ChainId, address adapter, address spokePool)",
  "event L1TokenEnabledForLiquidityProvision(address l1Token, address lpToken)",
  "event L2TokenDisabledForLiquidityProvision(address l1Token, address lpToken)",
  "event SetPoolRebalanceRoute(uint256 indexed destinationChainId, address indexed l1Token, address indexed destinationToken)",
  "event SetEnableDepositRoute(uint256 indexed originChainId, uint256 indexed destinationChainId, address indexed originToken, bool depositsEnabled)",
  "event SpokePoolAdminFunctionTriggered(uint256 indexed chainId, bytes message)"
];

export const HUBPOOL_ADDRESS = "0xc186fa914353c44b2e33ebe05f21846f1048beda";


// "event IdentifierSet(bytes32 newIdentifier)",
// "event CrossChainContractsSet(uint256 l2ChainId, address adapter, address spokePool)",
// "event L1TokenEnabledForLiquidityProvision(address l1Token, address lpToken)",
// "event L2TokenDisabledForLiquidityProvision(address l1Token, address lpToken)",
// "event SetPoolRebalanceRoute (uint256 indexed destinationChainId,address indexed l1Token,address indexed destinationToken)",
// "event SetEnableDepositRoute (uint256 indexed originChainId,uint256 indexed destinationChainId,address indexed originToken,bool depositsEnabled)",
// "event SpokePoolAdminFunctionT riggered(uint256 indexed chainId, bytes message)",
