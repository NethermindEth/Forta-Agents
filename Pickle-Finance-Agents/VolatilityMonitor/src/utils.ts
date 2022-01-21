import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { utils } from 'ethers';

export type Validator = (n: number) => boolean;
export type FindingGenerator = (
  id: number,
  keeper: string,
  strategy: string,
  last: number,
  count: number,
  frame: number,
) => Finding;

const decodePerformData = (performData: string): string => 
  utils.defaultAbiCoder.decode(["address"], performData)[0];

const countGteThreshold = (threshold: number): Validator =>
  (count: number): boolean => count >= threshold;

const notAddedRecently: Validator = (count: number): boolean => count === -1;

const multipleCallsFinding = (
  id: number,
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
  id: number,
  keeper: string,
  strategy: string,
  last: number,
  count: number,
  frame: number,
): Finding => Finding.fromObject({
  name: "Pickle Volatility Monitor",
  description: "Missing performUpkeep calls",
  alertId: "pickle-vm-1",
  type: FindingType.Info,
  severity: FindingSeverity.Medium,
  metadata: {
    keeperId: id.toString(),
    keeperAddress: keeper,
    strategyAddress: strategy,
    timeSinceLastUpkeep: last.toString(),
    numberOfUpkeepsToday: count.toString(),
    timeFrame: frame.toString(),
  }
});

const highCallsFinding = (
  id: number,
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
  id: number,
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
  countGteThreshold,
  notAddedRecently,
  highCallsFinding,
  mediumCallsFinding,
  notCalledFinding,
}
