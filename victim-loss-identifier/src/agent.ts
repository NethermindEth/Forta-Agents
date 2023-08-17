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
import { SCAM_DETECTOR_BOT_ID, SCAM_DETECTOR_ALERT_IDS, NINETY_DAYS } from "./constants";
import { ScammerInfo } from "./types";

const scammersCurrentlyMonitored: { [key: string]: ScammerInfo } = {};

export function provideInitialize(): Initialize {
  return async () => {
    alertConfig: {
      subscriptions: [
        {
          botId: SCAM_DETECTOR_BOT_ID,
          alertIds: SCAM_DETECTOR_ALERT_IDS
        }
      ] 
    }
  };
}

export function provideHandleAlert(): HandleAlert {
  return async (alertEvent: AlertEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const scammerAddress = alertEvent.alert.metadata["scammer_addresses"];

    if(!Object.keys(scammersCurrentlyMonitored).includes(scammerAddress)) {
      //
    };

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
