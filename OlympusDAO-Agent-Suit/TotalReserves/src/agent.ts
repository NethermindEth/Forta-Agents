import { 
  Finding, 
  TransactionEvent, 
  getEthersProvider,
  LogDescription
} from 'forta-agent';
import abi from './abi';
import { BigNumber } from 'ethers';
import ReserveFetcher from './reserve.fetcher';
import finding from "./findings";

const BIG_CHANGE_PERCENT: number = 20;
const TREASURY_CONTRACT: string = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";

export const provideHandleTransaction = (fetcher: ReserveFetcher, percentChange: number) =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const events: LogDescription[] = txEvent.filterLog(
      abi.TREASURY_ABI,
      fetcher.treasury,
    );

    let reserve: BigNumber = await fetcher.getLastSeenReserve(txEvent.blockNumber);

    events.forEach((log: LogDescription) => {
      const logReserve: BigNumber = log.args["totalReserves"];
      findings.push(
        ...finding.checkValues(
          reserve, 
          logReserve,
          percentChange,
        )
      );
      reserve = logReserve;
    });

    fetcher.update(txEvent.blockNumber, reserve);

    return findings;
  };


export default {
  handleTransaction: provideHandleTransaction(
    new ReserveFetcher(
      TREASURY_CONTRACT,
      getEthersProvider(),
    ),
    BIG_CHANGE_PERCENT,
  ),
};
