export const VAULT_ARBITRUM: string = "0x489ee077994B6658eAfA855C308275EAd8097C4A";
export const VAULT_AVALANCHE: string = "0x9ab2De34A33fB459b538c43f251eB825645e8595";
export const INCREASE_POSITION_EVENT: string =
  "event IncreasePosition(bytes32 key, address account, address collateralToken, address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,uint256 price,uint256 fee)";
export const UPDATE_POSITION_EVENT: string =
  "event UpdatePosition(bytes32 key, uint256 size, uint256 collateral, uint256 averagePrice, uint256 entryFundingRate, uint256 reserveAmount, int256 realisedPnl)";
export const PRICE_MULTIPLIER: number = 10 ** 30;
