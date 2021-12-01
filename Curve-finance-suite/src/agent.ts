import provideCrossAssetSwap from "./agents/cross.asset.swap";
import provideKillMeAgent from "./agents/kill.me"; // Yasmine doing this
import provideRemoveLiquidityImbalanceAgent from "./agents/remove.imbalance.liquidity";
import provideUnkillAgent from "./agents/unkill";
import provideAddPoolAgent from "./agents/registry.add.pool"; // Curve Agent 04 // Me doing this (import create.finding.ts)
import provideRemovePoolAgent from "./agents/registry.remove.pool"; // Curve Agent 05 // Me doing this (import create.finding.ts)
import provideMetaPoolDeployment from "./agents/deploy.metapool"; // Curve Agent 03 // Me doing this (import create.finding.ts)
import providecreateLockAgent from "./agents/curve.dao.create.lockevent";
import providesetKilledAgent from "./agents/curve.dao.killing.gauge"; // Curve Agent 08 // Me doing this (import create.finding.ts)
import providesetRewardsAgent from "./agents/curve.gauge.set.rewards"; // Curve Agent 09 // Me doing this (import create.finding.ts)
import provideCommitNewAdminEvent from "./agents/address.provider.ownership.transfer"; // Curve Agent 01 // Yasmine doing this
import provideclaimManyAgent from "./agents/curve.dao.claim.many"; // Curve Agent 07 // Me doing this (import create.finding.ts)
import provideMıgratePoolAgent from "./agents/pool.migration"; // Curve Agent 02 // Me doing this (import create.finding.ts)
import provideApplyNewFeesAgent from "./agents/apply.newfee"; // Curve Agent 06 // Caleb doing this
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
  provideMıgratePoolAgent,
  provideclaimManyAgent,
  provideApplyNewFeesAgent,
  provideRampAgent,
  provideStompRampAgent,
};
