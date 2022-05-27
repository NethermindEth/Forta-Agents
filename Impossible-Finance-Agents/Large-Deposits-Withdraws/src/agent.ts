import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { STAKING_CONTRACT, SALE_CONTRACTS } from "./utils";
import { saleHandler } from "./large.sales.handler";
import { stakeHandler } from "./large.staking.handler";
import StakeFetcher from "./stake.fetcher";
import SalesFetcher from "./sales.fetcher";

export const provideHandleTransaction =
  (
    sale_addresses: string[],
    stake_fetcher: StakeFetcher,
    sale_fetcher: SalesFetcher
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const handlerCalls = [
      stakeHandler(txEvent, stake_fetcher), // monitors staking contract.
      saleHandler(sale_addresses, txEvent, sale_fetcher), // monitors sale contracts.
    ];

    const findings = (await Promise.all(handlerCalls)).flat();
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    SALE_CONTRACTS,
    new StakeFetcher(getEthersProvider(),STAKING_CONTRACT),
    new SalesFetcher(getEthersProvider())
  ),
};
