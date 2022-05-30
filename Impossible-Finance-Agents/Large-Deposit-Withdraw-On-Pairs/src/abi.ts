import { Interface } from "ethers/lib/utils";

const FACTORY: Interface = new Interface([
  "function getPair(address token0, address token1) view returns (address pair)",
]);

const PAIR: Interface = new Interface([
  "event Mint(address indexed sender, uint amount0, uint amount1)",
  "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)",
  "function getReserves() external view returns (uint256, uint256)",
  "function token0() external view returns (address token)",
  "function token1() external view returns (address token)",
]);

export default {
  FACTORY,
  PAIR,
};
