export enum UtilizationLevel {
  Normal = 0,
  High = 1,
  VeryHigh = 2,
  Critical = 3
};

export enum Assets {
    USDC,
    DAI,
    USDT
};

export const TREHSHOLDS_VALUES: { [key in UtilizationLevel]: number } = {
    [UtilizationLevel.Normal]: 0,
    [UtilizationLevel.High]: 85,
    [UtilizationLevel.VeryHigh]: 90,
    [UtilizationLevel.Critical]: 95,  
};

export const ASSETS_ADDRESSES: { [key in Assets]: string } = {
  [Assets.USDC]: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  [Assets.DAI]: "0x6b175474e89094c44da98b954eedeac495271d0f",
  [Assets.USDT]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};