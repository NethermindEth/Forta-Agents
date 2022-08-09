import LRU from "lru-cache";

const LARGE_THRESHOLD = "2.5"; // percent

const SWAP_EVENT =
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out,uint amount1Out,address indexed to)";
const ERC20ABI = ["function balanceOf(address account) public view returns (uint256)"];
const PANCAKE_PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];
const PANCAKE_FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const INIT_CODE_PAIR_HASH = "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5";
const cache = new LRU<string, any>({
  max: 1000,
});

export { SWAP_EVENT, LARGE_THRESHOLD, ERC20ABI, PANCAKE_PAIR_ABI, PANCAKE_FACTORY_ADDRESS, INIT_CODE_PAIR_HASH, cache };
