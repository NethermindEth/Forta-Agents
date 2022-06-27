import { BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";

export const FACTORY: string = "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";
export const PAIR_INIT_CODE_HASH: string = "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5";
export const POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from("10000");
export const THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(10);

export const EVENTS_ABI: string[] = [
  "event Mint(address indexed sender, uint amount0, uint amount1)",
  "event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)",
];

export const FUNCTIONS_ABI: string[] = [
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address) public view returns (uint256)",
];




export const IFACE_EVENTS: Interface = new Interface(EVENTS_ABI);
