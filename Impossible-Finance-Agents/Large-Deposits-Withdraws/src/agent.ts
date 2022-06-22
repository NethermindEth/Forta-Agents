import { Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import { STAKING_CONTRACT, SALE_CONTRACTS } from "./utils";
import { saleHandler } from "./large.sales.handler";
import { stakeHandler } from "./large.staking.handler";
import StakeFetcher from "./stake.fetcher";
import SalesFetcher from "./sales.fetcher";

export const provideHandleTransaction =
  (
    stakingAddress: string,
    saleAddresses: string[],
    stakeFetcher: StakeFetcher,
    saleFetcher: SalesFetcher
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const handlerCalls = [
      stakeHandler(stakingAddress, txEvent, stakeFetcher), // monitors staking contract.
      saleHandler(saleAddresses, txEvent, saleFetcher), // monitors sale contracts.
    ];

    const findings = (await Promise.all(handlerCalls)).flat();
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    STAKING_CONTRACT,
    SALE_CONTRACTS,
    new StakeFetcher(getEthersProvider()),
    new SalesFetcher(getEthersProvider())
  ),
};
