import {
  BlockEvent,
  Finding,
  Initialize,
  HandleBlock,
  HandleAlert,
  AlertEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

export function provideInitialize(): Initialize {
  return async () => {};
}

export function provideHandleAlert(): HandleAlert {
  return async (alertEvent: AlertEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    return findings;
  };
}

export function provideHandleBlock(): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    return findings;
  };
}

export default {
  initialize: provideInitialize,
  handleAlert: provideHandleAlert,
  handleBlock: provideHandleBlock,
};
