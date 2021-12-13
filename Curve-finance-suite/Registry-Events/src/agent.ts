import abi from './abi';
import findings from './findings';
import { getEthersProvider, HandleTransaction, TransactionEvent } from 'forta-agent'
import RegistryFetcher from './registry.fetcher';

const PROVIDER_ADDRESS = "0x0000000022d53366457f9d5e68ec105046fc4383";

export const provideHandleTransaction = (fetcher: RegistryFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent) => txEvent
    .filterLog(abi.REGISTRY, await fetcher.getRegistry(txEvent.blockNumber))
    .map(findings.resolver);

export default {
  handleTransaction: provideHandleTransaction(
    new RegistryFetcher(PROVIDER_ADDRESS, getEthersProvider()),
  ),
};
