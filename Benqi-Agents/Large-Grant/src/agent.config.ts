import { AgentConfig, ThresholdMode } from "./utils";

const CONFIG: AgentConfig = {
  /**
   * AgentConfig.qiAddress:
   *    The (lowercase) address of the QI token.
   */
  qiAddress: "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5",

  /**
   * AgentConfig.comptrollerAddress:
   *    The (lowercase) address of the Comptroller contract.
   */
  comptrollerAddress: "0x486af39519b4dc9a7fccd318217352830e8ad9b4",

  /**
   * AgentConfig.thresholdMode:
   *    Determines how the threshold logic should work.
   *    Can be:
   *     - ABSOLUTE: A fixed amount in QI wei;
   *     - PERCENTAGE_TOTAL_SUPPLY: A percent of QI's totalSupply;
   *     - PERCENTAGE_COMPTROLLER_BALANCE: A percentage of the comptroller's QI
   *      balance on the previous block.
   */
  thresholdMode: ThresholdMode.PERCENTAGE_TOTAL_SUPPLY,

  /**
   * AgentConfig.threshold:
   *    It can be a string indicating the fixed threshold amount, in the case
   *    of config.thresholdMode being ABSOLUTE, or a string with an integer
   *    indicating a percentage, if config.thresholdMode is PERCENTAGE based.
   */
  threshold: "10",
};

export default CONFIG;
