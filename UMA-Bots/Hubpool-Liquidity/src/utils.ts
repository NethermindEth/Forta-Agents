import { Interface } from "ethers/lib/utils";

const HUBPOOL_EVENTS = "event LiquidityRemoved(address indexed l1Token,uint256 amount,uint256 lpTokensBurnt,address indexed liquidityProvider)";

const LIQUIDITY_REMOVED_IFACE: Interface = new Interface([HUBPOOL_EVENTS]);

const HUBPOOL_ADDRESS = "0xc186fA914353c44b2E33eBE05f21846F1048bEda";

const TOKEN_ABI: string = "function balanceOf(address account) external view returns (uint256)";
const TOKEN_IFACE: Interface = new Interface([TOKEN_ABI]);

export { HUBPOOL_ADDRESS, HUBPOOL_EVENTS, LIQUIDITY_REMOVED_IFACE, TOKEN_IFACE };
