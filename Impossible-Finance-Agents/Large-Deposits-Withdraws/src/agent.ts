import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { STAKING_CONTRACT, SALE_CONTRACTS, IDIA_TOKEN } from "./utils";
import { saleHandler } from "./large.sales.handler";
import { stakeHandler } from "./large.staking.handler";
import StakeFetcher from "./stake.fetcher";
import SalesFetcher from "./sales.fetcher";

export const provideHandleTransaction =
  (
    stakingContract : string,
    stakeFetcher: StakeFetcher,
    saleFetcher: SalesFetcher
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const handlerCalls = [
      stakeHandler(txEvent, stakeFetcher,stakingContract), // monitors staking contract.
      saleHandler(txEvent, saleFetcher), // monitors sale contracts.
    ];

    const findings = (await Promise.all(handlerCalls)).flat();
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    STAKING_CONTRACT,
    new StakeFetcher(getEthersProvider(),IDIA_TOKEN),
    new SalesFetcher(getEthersProvider(), SALE_CONTRACTS)
  ),
};
