import { Interface } from "@ethersproject/abi";

const FACTORY: Interface = new Interface([
  "function allPairsLength() view returns (uint256)",
  "function allPairs(uint256 index) view returns (address)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint256)",
]);

const PAIR: Interface = new Interface([
  "event Mint(address indexed sender, uint amount0, uint amount1)",
  "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32)",
]);

export default {
  FACTORY,
  PAIR,
};
