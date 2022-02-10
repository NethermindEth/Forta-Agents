import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { utils, BigNumberish } from 'ethers';

const decodePerformData = (performData: string): string => 
  utils.defaultAbiCoder.decode(["address"], performData)[0].toLowerCase();

const encodePerformData = (addr: string): string => 
  utils.defaultAbiCoder.encode(["address"], [addr]).toLowerCase();

const multipleCallsFinding = (
  id: BigNumberish,
  keeper: string,
  strategy: string,
  last: number,
  count: number,
  frame: number,
  severity: FindingSeverity,
): Finding => Finding.fromObject({
  name: "Pickle Volatility Monitor",
  description: "Many performUpkeep calls",
  alertId: "pickle-vm-1",
  type: FindingType.Info,
  severity,
  protocol: "Pickle Finance",
  metadata: {
    keeperId: id.toString(),
    keeperAddress: keeper,
    strategyAddress: strategy,
    timeSinceLastUpkeep: last.toString(),
    numberOfUpkeepsToday: count.toString(),
    timeFrame: frame.toString(),
  }
});

const notCalledFinding = (
  id: BigNumberish,
  keeper: string,
  strategy: string,
  last: number,
  frame: number,
): Finding => Finding.fromObject({
  name: "Pickle Volatility Monitor",
  description: "Missing performUpkeep calls",
  alertId: "pickle-vm-2",
  type: FindingType.Info,
  severity: FindingSeverity.Medium,
  protocol: "Pickle Finance",
  metadata: {
    keeperId: id.toString(),
    keeperAddress: keeper,
    strategyAddress: strategy,
    timeSinceLastUpkeep: last.toString(),
    numberOfUpkeepsToday: "0",
    timeFrame: frame.toString(),
  }
});

const highCallsFinding = (
  id: BigNumberish,
  keeper: string,
  strategy: string,
  last: number,
  count: number,
  frame: number,
): Finding => multipleCallsFinding(
  id,
  keeper,
  strategy,
  last,
  count,
  frame,
  FindingSeverity.High,
);

const mediumCallsFinding = (
  id: BigNumberish,
  keeper: string,
  strategy: string,
  last: number,
  count: number,
  frame: number,
): Finding => multipleCallsFinding(
  id,
  keeper,
  strategy,
  last,
  count,
  frame,
  FindingSeverity.Medium,
);

export default {
  decodePerformData,
  encodePerformData,
  highCallsFinding,
  mediumCallsFinding,
  notCalledFinding,
}
