import provideESMJoinEventAgent from "./join.event";
import provideESMFireEventAgent from "./fire.event";
import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { utils } from "ethers";
import { CHAINLOG_ADDRESS, UPDATE_ADDR_ABI } from "./utils";
import AddressFetcher from "./address.fetcher";

const ESM_FETCHER: AddressFetcher = new AddressFetcher(getEthersProvider(), CHAINLOG_ADDRESS);

const JOIN_EVENT_ALERTID: string = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID: string = "MakerDAO-ESM-2";

const provideAgentHandler = (joinEvent: string, fireEvent: string, fetcher: AddressFetcher): HandleTransaction => {
  let esmAddress = fetcher.esmAddress;
  const joinEventHandler = provideESMJoinEventAgent(joinEvent, esmAddress);
  const fireEventHandler = provideESMFireEventAgent(fireEvent, esmAddress);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    // Listen to UpdateAddress event & update the ESM contract.
    txEvent.filterLog(UPDATE_ADDR_ABI, CHAINLOG_ADDRESS).forEach((log) => {
      if (log.args.key == utils.formatBytes32String("MCD_ESM")) {
        esmAddress = log.args.addr;
      }
    });

    findings = [...(await joinEventHandler(txEvent)), ...(await fireEventHandler(txEvent))];

    return findings;
  };
};

export default {
  provideAgentHandler,
  handleTransaction: provideAgentHandler(JOIN_EVENT_ALERTID, FIRE_EVENT_ALERTID, ESM_FETCHER),
};
