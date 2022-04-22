import { Interface } from "@ethersproject/abi";

const V3_PAIR: string[] = [ // https://etherscan.io/address/0xe0278679c55805aa17a12eec14c436ad058c55ac#code
  `function mint(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount,
    bytes calldata data
  ) external returns (uint256 amount0, uint256 amount1)`,
  `function burn(
    int24 tickLower,
    int24 tickUpper,
    uint128 amount
  ) external returns (uint256 amount0, uint256 amount1)`,
  `function collect(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount0Requested,
    uint128 amount1Requested
  ) external returns (uint128 amount0, uint128 amount1)`,
  `function swap(
    address recipient,
    bool zeroForOne,
    int256 amountSpecified,
    uint160 sqrtPriceLimitX96,
    bytes calldata data
  ) external returns (int256 amount0, int256 amount1)`,
  `function flash(
    address recipient,
    uint256 amount0,
    uint256 amount1,
    bytes calldata data
  ) external`,
  `function collectProtocol(
    address recipient,
    uint128 amount0Requested,
    uint128 amount1Requested
  ) external returns (uint128 amount0, uint128 amount1)`
];

const V2_PAIR: string[] = [ // https://etherscan.io/address/0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc#code
  "function mint(address to) external returns (uint liquidity)",
  "function burn(address to) external returns (uint amount0, uint amount1)",
  "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external",
  "function skim(address to) external",
];

const COMMON: string[] = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
];

const TRANSFER: string[] = [
  "event Transfer(address indexed from, address indexed to, uint value)",
];

const V2_IFACE: Interface = new Interface(V2_PAIR);
const V3_IFACE: Interface = new Interface(V3_PAIR);

export default {
  V2_PAIR,
  V3_PAIR,
  COMMON,
  V2_IFACE,
  V3_IFACE,
  TRANSFER,
};
