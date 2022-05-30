export const SWAP_FACTORY_ADDRESS =
  "0x4233Ad9B8B7C1CCf0818907908A7f0796A3dF85F";

export const SWAP_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

export const PAIR_SWAP_ABI = [
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];
