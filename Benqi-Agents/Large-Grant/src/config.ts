import { ThresholdMode } from "./utils";

/**
 * THRESHOLD_MODE:
 *  Can be either ABSOLUTE or PERCENTAGE:
 *  - ABSOLUTE: A fixed amount in QI wei
 *  - PERCENTAGE_TOTAL_SUPPLY: A percent of QI's totalSupply
 *  - PERCENTAGE_COMP_BALANCE: A percent of the comptroller's QI balance
 */
export const THRESHOLD_MODE = ThresholdMode.ABSOLUTE;

/**
 * THRESHOLD:
 *  If THRESHOLD_MODE is set to:
 *  - ABSOLUTE: A string indicating the fixed threshold amount
 *  - PERCENTAGE_TOTAL_SUPPLY: A string with an integer indicating the percentage
 *  - PERCENTAGE_COMP_BALANCE: A string with an integer indicating the percentage
 */
export const THRESHOLD = "100";
