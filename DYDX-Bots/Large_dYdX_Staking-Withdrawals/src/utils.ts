import { utils, BigNumber } from "ethers";

export const STAKED_ABI: string =  `event Staked(
    address indexed staker,
    address spender,
    uint256 underlyingAmount,
    uint256 stakeAmount
  )`

export const WITHDREW_STAKE_ABI: string = `event WithdrewStake(
    address indexed staker,
    address recipient,
    uint256 underlyingAmount,
    uint256 stakeAmount
  )`

export const THRESHOLD_PERCENTAGE: number = 20;

export const THRESHOLD_STATIC_AMOUNT: BigNumber = BigNumber.from("500000000000000000000000"); // 500,000