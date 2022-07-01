import { BigNumber, utils } from "ethers";

export const COMPTROLLER_ADDR = "0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4";
// use the address below for testnet
//export const COMPTROLLER_ADDR = "0x986a347285dc266FB483F7eFDa68F221F3F1AF05";

const COMPTROLLER_ABI = ["function getAllMarkets() view returns (address[])", "event MarketListed(address qiToken)"];
export const COMPTROLLER_IFACE = new utils.Interface(COMPTROLLER_ABI);

export const THRESHOLDS = {
  supply: [
    BigNumber.from(100000), // lower supply rate threshold
    BigNumber.from(50).mul(1e9).mul(1e9), // 50%  upper supply rate threshold
  ],
  borrow: [
    BigNumber.from(100000), // lower borrow rate threshold
    BigNumber.from(50).mul(1e9).mul(1e9), // 50% upper borrow rate threshold
  ],
};

// use the below values for test blocks.
/*
export const THRESHOLDS = {
  supply: [
    BigNumber.from(10000), // lower supply rate threshold
    BigNumber.from(6200000000), // upper supply rate threshold
  ],
  borrow: [
    BigNumber.from(10000), // lower borrow rate threshold
    BigNumber.from(6200000000), // upper borrow rate threshold
  ],
};
*/

export const QI_TOKENS_ABI: string[] = [
  "function borrowRatePerTimestamp() external view returns (uint)",
  "function supplyRatePerTimestamp() external view returns (uint)",
];

// List of markets that will be ignored by the bot.
export const EXCLUDED_MARKETS: string[] = [
  "0x35Bd6aedA81a7E5FC7A7832490e71F757b0cD9Ce", // qiQI market.
];
