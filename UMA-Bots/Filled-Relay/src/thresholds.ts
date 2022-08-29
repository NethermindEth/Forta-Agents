import BN from "bignumber.js";

export const AMOUNT_THRESHOLDS: { [key: string]: BN } = {
  "Wrapped Ether": BN(0.37),
  "USD Coin": BN(1000000),
};

export const RELAY_THRESHOLD: { [key: string]: number } = {
  number: 3, //max number of relays
  time: 10, //time threshold in minutes to check the number of relays
};
