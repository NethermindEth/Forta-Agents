import { utils } from "ethers";

export const STAKED_ABI: string = "event Staked(address indexed staker, address spender, uint256 amount)";
export const STAKED_SIG: string = "Staked(address,address,uint256)";

export const WITHDREW_STAKE_ABI: string =
  "event WithdrewStake(address indexed staker, address recipient, uint256 amount)";
export const WITHDREW_STAKE_SIG: string = "WithdrewStake(address,address,uint256)";

export const WITHDREW_DEBT_ABI: string =
  "event WithdrewDebt(address indexed staker, address recipient, uint256 amount, uint256 newDebtBalance)";
export const WITHDREW_DEBT_SIG: string = "WithdrewDebt(address,address,uint256,uint256)";

const USDC_ABI: string = "function balanceOf(address account) external view returns (uint256)";
export const USDC_IFACE: utils.Interface = new utils.Interface([USDC_ABI]);

export const THRESHOLD_PERCENTAGE: number = 20;
