const BLACKOUT_WINDOW_CHANGED_EVENT: string = "event BlackoutWindowChanged(uint256 blackoutWindow)";
const EPOCH_PARAMS_CHANGED_EVENT: string = "event EpochParametersChanged((uint128, uint128) epochParameters)";
const REWARDS_PER_SECOND_UPDATED_EVENT: string = "event RewardsPerSecondUpdated(uint256 emissionPerSecond)";
export const EVENTS: string[] = [
  BLACKOUT_WINDOW_CHANGED_EVENT,
  EPOCH_PARAMS_CHANGED_EVENT,
  REWARDS_PER_SECOND_UPDATED_EVENT,
];

export const BLACKOUT_WINDOW_CHANGED_SIG: string = "BlackoutWindowChanged(uint256)";
export const EPOCH_PARAMS_CHANGED_SIG: string = "EpochParametersChanged((uint128,uint128))";
export const REWARDS_PER_SECOND_UPDATED_SIG: string = "RewardsPerSecondUpdated(uint256)";
