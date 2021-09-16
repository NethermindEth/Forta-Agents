import provideCrossAssetSwap from "./agents/crossAssetSwap";
import provideKillMeAgent from "./agents/killme";
import provideRemoveLiquidityImbalanceAgent from "./agents/removeImbalanceLiquidity";
import provideUnkillAgent from "./agents/unkill";
import provideAddPoolAgent from "./agents/addPool";
import provideRemovePoolAgent from "./agents/removePool";
import provideMetaPoolDeployment from "./agents/deployMetaPool";
import providecreateLockAgent from "./agents/CurveDao-CreateLockEvent";
import providesetKilledAgent from "./agents/Curve-dao-KillingGauge";
import providesetRewardsAgent from "./agents/Curve-Gauge-SetRewards";
import provideCommitNewAdminEvent from "./agents/registry_Ownership_Transfer";

export {
  provideCrossAssetSwap,
  provideKillMeAgent,
  providesetKilledAgent,
  provideRemoveLiquidityImbalanceAgent,
  provideUnkillAgent,
  provideAddPoolAgent,
  provideRemovePoolAgent,
  provideMetaPoolDeployment,
  providecreateLockAgent,
  providesetRewardsAgent,
  provideCommitNewAdminEvent,
};
