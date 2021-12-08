import provideCrossAssetSwap from "./agents/cross.asset.swap";
import provideKillMeAgent from "./agents/kill.me";
import provideRemoveLiquidityImbalanceAgent from "./agents/remove.imbalance.liquidity";
import provideUnkillAgent from "./agents/unkill";
import provideAddPoolAgent from "./agents/registry.add.pool";
import provideRemovePoolAgent from "./agents/registry.remove.pool";
import provideMetaPoolDeployment from "./agents/deploy.metapool";
import providecreateLockAgent from "./agents/curve.dao.create.lockevent";
import providesetKilledAgent from "./agents/curve.dao.killing.gauge";
import providesetRewardsAgent from "./agents/curve.gauge.set.rewards";
import provideCommitNewAdminEvent from "./agents/address.provider.ownership.transfer";
import provideclaimManyAgent from "./agents/curve.dao.claim.many";
import provideApplyNewFeesAgent from "./agents/apply.newfee";
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
  provideMetaPoolDeployment,
  providecreateLockAgent,
  providesetRewardsAgent,
  provideCommitNewAdminEvent,
  provideclaimManyAgent,
  provideApplyNewFeesAgent,
  provideRampAgent,
  provideStompRampAgent,
};
export default {
  handleTransaction: provideApplyNewFeesAgent(
    "SomeId",
    "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5"
 ),
}
