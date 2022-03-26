import { ethers } from "ethers";

const COMPTROLLER_ABI = ["function getAllMarkets() view returns (address[])", "event MarketListed(address qiToken)"];

const QITOKEN_ABI = [
  "event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)",
  "function totalSupply() view returns (uint256)",
];

export const COMPTROLLER_IFACE = new ethers.utils.Interface(COMPTROLLER_ABI);

export const QITOKEN_IFACE = new ethers.utils.Interface(QITOKEN_ABI);
