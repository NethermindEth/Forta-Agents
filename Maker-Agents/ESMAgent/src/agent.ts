import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { utils } from "ethers";
import { CHAINLOG_ADDRESS, UPDATE_ADDR_ABI } from "./utils";
import AddressFetcher from "./address.fetcher";
import provideESMJoinEventAgent from "./join.event";
import provideESMFireEventAgent from "./fire.event";

const ESM_FETCHER: AddressFetcher = new AddressFetcher(getEthersProvider(), CHAINLOG_ADDRESS);

const JOIN_EVENT_ALERTID: string = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID: string = "MakerDAO-ESM-2";

const initialize = (fetcher: AddressFetcher) => async () => {
  await fetcher.getEsmAddress("latest");
};

const provideAgentHandler = (
  joinEvent: string,
  fireEvent: string,
  fetcher: AddressFetcher,
  chainLogAddr: string
): HandleTransaction => {
  const joinEventHandler = provideESMJoinEventAgent(joinEvent, fetcher);
  const fireEventHandler = provideESMFireEventAgent(fireEvent, fetcher);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    // Listen to UpdateAddress event & update the ESM contract.
    txEvent.filterLog(UPDATE_ADDR_ABI, chainLogAddr).forEach(async (log) => {
      if (log.args.key === utils.formatBytes32String("MCD_ESM")) {
        fetcher.esmAddress = log.args.addr.toLowerCase();
      }
    });

    findings = [...(await joinEventHandler(txEvent)), ...(await fireEventHandler(txEvent))];

    return findings;
  };
};

export default {
  initialize: initialize(ESM_FETCHER),
  provideAgentHandler,
  handleTransaction: provideAgentHandler(JOIN_EVENT_ALERTID, FIRE_EVENT_ALERTID, ESM_FETCHER, CHAINLOG_ADDRESS),
};
