
import provideCrossAssetSwap from "./agents/cross.asset.swap";
import provideKillMeAgent from "./agents/kill.me";
import provideRemoveLiquidityImbalanceAgent from "./agents/remove.imbalance.liquidity";
import provideUnkillAgent from "./agents/unkill";
import provideAddPoolAgent from "./agents/registry.add.pool";
import provideRemovePoolAgent from "./agents/registry.remove.pool";
import providecreateLockAgent from "./agents/curve.dao.create.lockevent";
import providesetKilledAgent from "./agents/curve.dao.killing.gauge";
import providesetRewardsAgent from "./agents/curve.gauge.set.rewards";
import provideCommitNewAdminEvent from "./agents/address.provider.ownership.transfer";
// import provideMıgratePoolAgent from "./agents/pool.migration";
import provideRampAgent from "./agents/ramp";
import provideStompRampAgent from "./agents/stop.ramp";


export {
  provideCrossAssetSwap,
  provideKillMeAgent,
  providesetKilledAgent,
  provideRemoveLiquidityImbalanceAgent,
  provideUnkillAgent,
  provideAddPoolAgent,
  provideRemovePoolAgent,
  providecreateLockAgent,
  providesetRewardsAgent,
  provideCommitNewAdminEvent,
  provideclaimManyAgent,
  // provideMıgratePoolAgent,
  provideRampAgent,
  provideStompRampAgent,
};
