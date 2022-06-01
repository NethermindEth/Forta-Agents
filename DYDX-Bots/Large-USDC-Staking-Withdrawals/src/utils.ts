import { utils } from "ethers";

export const STAKED_ABI: string = "event Staked(address indexed staker, address spender, uint256 amount)";

export const WITHDREW_STAKE_ABI: string =
  "event WithdrewStake(address indexed staker, address recipient, uint256 amount)";

export const WITHDREW_DEBT_ABI: string =
  "event WithdrewDebt(address indexed staker, address recipient, uint256 amount, uint256 newDebtBalance)";

export const MODULE_IFACE: utils.Interface = new utils.Interface([STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI]);

const USDC_ABI: string = "function balanceOf(address account) external view returns (uint256)";
export const USDC_IFACE: utils.Interface = new utils.Interface([USDC_ABI]);
