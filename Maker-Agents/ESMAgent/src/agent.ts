import provideESMJoinEventAgent from "./join.event";
import provideESMFireEventAgent from "./fire.event";
import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

const MakerDAO_ESM_CONTRACT = "0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58";
const JOIN_EVENT_ALERTID = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID = "MakerDAO-ESM-2";

const provideAgentHandler = (): HandleTransaction => {
  const joinEventHandler = provideESMJoinEventAgent(JOIN_EVENT_ALERTID, MakerDAO_ESM_CONTRACT);
  const fireEventHandler = provideESMFireEventAgent(FIRE_EVENT_ALERTID, MakerDAO_ESM_CONTRACT);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    findings = [...(await joinEventHandler(txEvent)), ...(await fireEventHandler(txEvent))];

    return findings;
  };
};

export default {
  provideAgentHandler,
  handleTransaction: provideAgentHandler(),
};
