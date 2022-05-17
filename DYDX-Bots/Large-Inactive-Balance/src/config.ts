import { BigNumber } from "ethers";

export interface BotConfig {
  mode: string;
  thresholdData: BigNumber;
}

// Use STATIC_CONFIG to run the agent with a static threshold.
// Update `thresholdData` to ajust the threshold amount used by the bot.
export const STATIC_CONFIG: BotConfig = {
  mode: "STATIC",
  thresholdData: BigNumber.from(1000000), // 1M threshold
};

// Use DYNAMIC_CONFIG to run the agent with a dynamic threshold.
// Update `thresholdData` to ajust the percentage used by the bot to set the threshold.
export const DYNAMIC_CONFIG: BotConfig = {
  mode: "PERCENTAGE",
  thresholdData: BigNumber.from(20), // 20%
};
