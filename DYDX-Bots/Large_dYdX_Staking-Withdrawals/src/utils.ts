import { Interface } from "@ethersproject/abi";
import { utils } from "ethers";

export const STAKED_ABI: string = `event Staked(
    address indexed staker,
    address spender,
    uint256 underlyingAmount,
    uint256 stakeAmount
  )`;

export const WITHDREW_STAKE_ABI: string = `event WithdrewStake(
    address indexed staker,
    address recipient,
    uint256 underlyingAmount,
    uint256 stakeAmount
  )`;

export const MODULE_IFACE: utils.Interface = new Interface([STAKED_ABI, WITHDREW_STAKE_ABI]);

const DYDX_ABI: string = "function balanceOf(address account) external view returns (uint256)";
export const DYDX_IFACE: utils.Interface = new utils.Interface([DYDX_ABI]);
