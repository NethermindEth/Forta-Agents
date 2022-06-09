import { Interface, keccak256, getCreate2Address } from "ethers/lib/utils";

export const SWAP_ABI: string = `event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
)`;

const GET_RESERVES_ABI: string = `function getReserves()
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

export const MULTICALL2_ABI = [
  {
    inputs: [
      {
        internalType: "bool",
        name: "requireSuccess",
        type: "bool",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes",
          },
        ],
        internalType: "struct Multicall2.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "tryAggregate",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "success",
            type: "bool",
          },
          {
            internalType: "bytes",
            name: "returnData",
            type: "bytes",
          },
        ],
        internalType: "struct Multicall2.Result[]",
        name: "returnData",
        type: "tuple[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const MULTICALL2_IFACE: Interface = new Interface(MULTICALL2_ABI);

export const create2Pair = (tokenA: string, tokenB: string, factory: string, initCodeHash: string) => {
  let token0, token1;
  tokenA < tokenB ? ((token0 = tokenA), (token1 = tokenB)) : ((token0 = tokenB), (token1 = tokenA));
  const salt: string = keccak256(token0.concat(token1.slice(2)));
  return getCreate2Address(factory, salt, initCodeHash).toLowerCase();
};
