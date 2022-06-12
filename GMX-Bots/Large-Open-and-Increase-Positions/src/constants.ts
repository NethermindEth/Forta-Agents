import { Interface } from "@ethersproject/abi";

type contractType = {
  VAULT_ARBITRUM: string;
  VAULT_AVALANCHE: string;
  INCREASE_POSITION_EVENT: string;
  UPDATE_POSITION_EVENT: string;

  THRESHOLD: number;
  PRICE_MULTIPLIER: number;
};

export const VAULT_CONSTANTS: contractType = {
  VAULT_ARBITRUM: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
  VAULT_AVALANCHE: "0x9ab2De34A33fB459b538c43f251eB825645e8595",

  INCREASE_POSITION_EVENT:
    "event IncreasePosition(bytes32 key, address account, address collateralToken, address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,uint256 price,uint256 fee)",
  UPDATE_POSITION_EVENT:
    "event UpdatePosition(bytes32 key, uint256 size, uint256 collateral, uint256 averagePrice, uint256 entryFundingRate, uint256 reserveAmount, int256 realisedPnl)",

  THRESHOLD: 5000,
  PRICE_MULTIPLIER: 10 ** 30,
};

export const INCREASE_POSITION_ABI: string[] = [VAULT_CONSTANTS.INCREASE_POSITION_EVENT];
export const IFACE: Interface = new Interface(INCREASE_POSITION_ABI);
export const POSITIONS_ABI: string[] = [VAULT_CONSTANTS.INCREASE_POSITION_EVENT, VAULT_CONSTANTS.UPDATE_POSITION_EVENT];
export const IFACE_POSITIONS: Interface = new Interface(POSITIONS_ABI);
export const POSITIONS_EVENT = [VAULT_CONSTANTS.INCREASE_POSITION_EVENT, VAULT_CONSTANTS.UPDATE_POSITION_EVENT];
