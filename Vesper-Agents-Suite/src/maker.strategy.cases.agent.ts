import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType
} from "forta-agent";
import fetch from "node-fetch";

export const provideMakerStrategyHandler = (): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const strategies = await fetch("https://api.vesper.finance/dashboard");

    return findings;
  };
};

export default {
  handleBlock: provideMakerStrategyHandler()
};
