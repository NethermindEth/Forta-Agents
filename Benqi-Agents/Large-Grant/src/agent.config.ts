import { ThresholdMode } from "./utils";

/**
 * THRESHOLD_MODE:
 *  Can be:
 *  - ABSOLUTE: A fixed amount in QI wei
 *  - PERCENTAGE_TOTAL_SUPPLY: A percent of QI's totalSupply
 *  - PERCENTAGE_COMP_BALANCE: A percent of the comptroller's QI balance
 */
export const THRESHOLD_MODE = ThresholdMode.ABSOLUTE;

/**
 * THRESHOLD:
 *  It can be a string indicating the fixed threshold amount, in the case of
 *  THRESHOLD_MODE being ABSOLUTE, or a string with an integer indicating the
 *  percentage, if THRESHOLD_MODE is PERCENTAGE based.
 */
export const THRESHOLD = "100";
