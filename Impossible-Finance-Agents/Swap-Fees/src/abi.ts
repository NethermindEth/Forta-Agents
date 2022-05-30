import { Interface } from "ethers/lib/utils";

const FACTORY: Interface = new Interface([
  "function getPair(address token0, address token1) external view returns (address pair)",
]);

const PAIR: Interface = new Interface([
  "function token0() external view returns (address token)",
  "function token1() external view returns (address token)",
  "event UpdatedTradeFees(uint256 _oldFee, uint256 _newFee)",
  "event UpdatedWithdrawalFeeRatio(uint256 _oldWithdrawalFee, uint256 _newWithdrawalFee)",
]);

export default {
  FACTORY,
  PAIR,
};
