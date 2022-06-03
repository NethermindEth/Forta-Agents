import { Interface, keccak256, getCreate2Address } from "ethers/lib/utils";

const JOE_PAIR_INIT_CODE_HASH: string = "0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91";

export const SWAP_ABI: string = `event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
)`;

const GET_RESERVES_ABI: string = `    function getReserves()
    public
    view
    returns (
        uint112 _reserve0,
        uint112 _reserve1,
        uint32 _blockTimestampLast
    )`;

const TOKEN0_ABI: string = "function token0() view returns (address token)";
const TOKEN1_ABI: string = "function token1() view returns (address token)";

export const PAIR_ABI: string[] = [TOKEN0_ABI, TOKEN1_ABI, SWAP_ABI, GET_RESERVES_ABI];

export const PAIR_IFACE: Interface = new Interface(PAIR_ABI);

/* NOTE: UNEDITED
const AGGREGATE_ABI =
  "function aggregate((address, bytes)[] calls) public returns (uint256 blockNumber, bytes[] returnData)";
*/

// NOTE: REMOVE `view`
const AGGREGATE_ABI =
  "function aggregate((address, bytes)[] calls) public view returns (uint256 blockNumber, bytes[] returnData)";

export const MULTICALL_IFACE: Interface = new Interface([AGGREGATE_ABI]);

export const create2Pair = (tokenA: string, tokenB: string, factory: string, initCodeHash: string) => {
  let token0, token1;
  tokenA < tokenB ? ((token0 = tokenA), (token1 = tokenB)) : ((token0 = tokenB), (token1 = tokenA));
  const salt: string = keccak256(token0.concat(token1.slice(2)));
  return getCreate2Address(factory, salt, initCodeHash).toLowerCase();
};
