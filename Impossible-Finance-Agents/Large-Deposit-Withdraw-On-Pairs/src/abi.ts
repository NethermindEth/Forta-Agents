import { Interface } from "@ethersproject/abi";

const FACTORY: Interface = new Interface([
  "function getPair(address token0, address token1) view returns (address pair)",
]);

const PAIR: Interface = new Interface([
  "event Mint(address indexed sender, uint amount0, uint amount1)",
  "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32)",
  "function token0() view returns (address token)",
  "function token1() view returns (address token)",
]);

export default {
  FACTORY,
  PAIR,
};
