import BN from "bignumber.js";

export const DECIMALS = new BN(10).pow(18).toString();

export const MIN_PREVIOUS_BALANCE = new BN(1).multipliedBy(DECIMALS);
export const HIGH_THRESHOLD = 1; //100%
export const MEDIUM_THRESHOLD = 0.5; //50%
export const LOW_THRESHOLD = 0.25; //25%

export const ABSOLUTE_THRESHOLD = new BN(10).multipliedBy(DECIMALS); //threshold for when previous balance is 0
