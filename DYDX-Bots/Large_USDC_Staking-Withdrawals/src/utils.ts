import { utils } from "ethers";

export const PROXY_ADDRESS: string = "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941";

export const STAKED_ABI: string = "event Staked(address indexed staker, address spender, uint256 amount)";
export const STAKED_SIG: string = "Staked(address,address,uint256)";

export const WITHDREW_STAKE_ABI: string =
  "event WithdrewStake(address indexed staker, address recipient, uint256 amount)";
export const WITHDREW_STAKE_SIG: string = "WithdrewStake(address,address,uint256)";

export const WITHDREW_DEBT_ABI: string =
  "event WithdrewDebt(address indexed staker, address recipient, uint256 amount, uint256 newDebtBalance)";
export const WITHDREW_DEBT_SIG: string = "WithdrewDebt(address,address,uint256,uint256)";

export const USDC_ADDRESS: string = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_ABI: string = "function balanceOf(address account) external view returns (uint256)";
export const USDC_IFACE: utils.Interface = new utils.Interface([USDC_ABI]);
