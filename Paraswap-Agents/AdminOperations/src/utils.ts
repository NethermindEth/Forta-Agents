import { Interface } from "ethers/lib/utils";

// array of operations to monitor
export const ADMIN_OPERATIONS = [
  "function transferTokens(address token, address payable destination, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function setImplementation(bytes4 selector, address implementation)",
  "function registerPartner(address partner, uint256 _partnerShare, bool _noPositiveSlippage, bool _positiveSlippageToUser, uint16 _feePercent, string calldata partnerId, bytes calldata _data)",
  "function setFeeWallet(address payable _feeWallet)",
  "event RouterInitialized(address indexed router)",
  "event AdapterInitialized(address indexed adapter)",
];

// <ChainId , AugustusSwapper contract address>
export const AUGUSTUS_SWAPPER_CONTRACTS: { [key: number]: string } = {
  "1": "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Ethereum Mainnet
  "56": "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // BSC
  "137": "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Polygon
  "43114": "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Avalanche
  "250": "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Fantom
  "3": "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // Ropsten
};

export const SWAPPER_IFACE = new Interface(ADMIN_OPERATIONS);
