import { BigNumberish } from "ethers";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

type FindingGenerator = (
  log: LogDescription,
  reserve0: BigNumberish,
  reserve1: BigNumberish
) => Finding;

const addLiquity: FindingGenerator = (
  log: LogDescription,
  reserve0: BigNumberish,
  reserve1: BigNumberish
): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Liquidity Action",
    description: "Large liquidity Added",
    alertId: "impossible-9-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pair: log.address.toLowerCase(),
      amount0: log.args.amount0.toString(),
      amount1: log.args.amount1.toString(),
      sender: log.args.sender.toLowerCase(),
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
    },
  });

const removeLiquity: FindingGenerator = (
  log: LogDescription,
  reserve0: BigNumberish,
  reserve1: BigNumberish
): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Updated",
    description: "Liquidity Removed",
    alertId: "impossible-9-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pair: log.address.toLowerCase(),
      amount0: log.args.amount0.toString(),
      amount1: log.args.amount1.toString(),
      sender: log.args.sender.toLowerCase(),
      to: log.args.to.toLowerCase(),
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
    },
  });

const findingsRouter: Record<string, FindingGenerator> = {
  Mint: addLiquity,
  Burn: removeLiquity,
};

const createFinding: FindingGenerator = (
  log: LogDescription,
  reserve0: BigNumberish,
  reserve1: BigNumberish
): Finding => findingsRouter[log.name](log, reserve0, reserve1);

export default createFinding;
