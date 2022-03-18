// array of operations to monitor
export const ADMIN_OPERATIONS = [
  "function transferTokens(address token, address payable destination, uint256 amount)",
  "function setImplementation(bytes4 selector, address implementation)",
  "function registerPartner(address partner, uint256 _partnerShare, bool _noPositiveSlippage, bool _positiveSlippageToUser, uint16 _feePercent, string calldata partnerId, bytes calldata _data)",
  "function setFeeWallet(address payable _feeWallet)",
  "event RouterInitialized(address indexed router)",
  "event AdapterInitialized(address indexed adapter)",
];

export const AUGUSTUS_SWAPPER_CONTRACT: string = "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57";
