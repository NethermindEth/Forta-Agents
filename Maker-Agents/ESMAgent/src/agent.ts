import provideESMJoinEventAgent from "./join.event"; 
import provideESMFireEventAgent from "./fire.event";
import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { CHAINLOG_ADDRESS } from "./utils";
import AddressFetcher from "./address.fetcher";

const ESM_FETCHER: AddressFetcher = new AddressFetcher(getEthersProvider(), CHAINLOG_ADDRESS);
let ESM_ADDRESS: string = "";

const JOIN_EVENT_ALERTID: string = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID: string = "MakerDAO-ESM-2";

const provideInitialize = (esmFetcher: AddressFetcher) => async () => {
  ESM_ADDRESS = await esmFetcher.getEsmAddress("latest");
};

const provideAgentHandler = (joinEvent: string, fireEvent: string, esmAddress?: string): HandleTransaction => {
  if (!esmAddress) esmAddress = ESM_ADDRESS;
  const joinEventHandler = provideESMJoinEventAgent(joinEvent, esmAddress);
  const fireEventHandler = provideESMFireEventAgent(fireEvent, esmAddress);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    findings = [...(await joinEventHandler(txEvent)), ...(await fireEventHandler(txEvent))];

    return findings;
  };
};

export default {
  provideInitialize,
  initialize: provideInitialize(ESM_FETCHER),
  provideAgentHandler,
  handleTransaction: provideAgentHandler(JOIN_EVENT_ALERTID, FIRE_EVENT_ALERTID, ESM_ADDRESS),
};
