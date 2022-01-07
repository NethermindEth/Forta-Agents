import { 
  getEthersProvider,
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import utils from './utils';
import { utils as ethers } from "ethers";
import BondsFetcher from './bonds.fetcher';

const REDEEM_HELPER_CONTRACT: string = "0xE1e83825613DE12E8F0502Da939523558f0B819E";

export const provideHandleTransaction = (fetcher: BondsFetcher): HandleTransaction => 
  async (txEvent: TransactionEvent) => 
    (await fetcher.getBondsContracts(txEvent.blockNumber))
      .map((address: string) => txEvent
        .filterFunction(utils.BONDS_ABI, address)
        .map((desc: ethers.TransactionDescription) => 
          utils.createFinding(desc, address)
        )
      ).flat();

export default {
  handleTransaction: provideHandleTransaction(
    new BondsFetcher(
      REDEEM_HELPER_CONTRACT,
      getEthersProvider(),
    )
  ),
};
