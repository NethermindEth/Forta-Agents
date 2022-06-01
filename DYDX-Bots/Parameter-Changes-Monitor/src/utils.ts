import { utils } from "ethers";

const BLACKOUT_WINDOW_CHANGED_EVENT: string = "event BlackoutWindowChanged(uint256 blackoutWindow)";
const EPOCH_PARAMS_CHANGED_EVENT: string = "event EpochParametersChanged((uint128, uint128) epochParameters)";
const REWARDS_PER_SECOND_UPDATED_EVENT: string = "event RewardsPerSecondUpdated(uint256 emissionPerSecond)";
export const EVENTS: string[] = [
  BLACKOUT_WINDOW_CHANGED_EVENT,
  EPOCH_PARAMS_CHANGED_EVENT,
  REWARDS_PER_SECOND_UPDATED_EVENT,
];

export const MODULE_IFACE: utils.Interface = new utils.Interface(EVENTS);
