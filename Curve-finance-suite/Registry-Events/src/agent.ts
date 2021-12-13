import abi from './abi';
import findings from './findings';
import { HandleTransaction, TransactionEvent } from 'forta-agent'

const REGISTRY_ADDRESS = "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5";

export const provideHandleTransaction = (registryAddress: string): HandleTransaction =>
  async (txEvent: TransactionEvent) => txEvent
    .filterLog(abi.REGISTRY, registryAddress)
    .map(findings.resolver);

export default {
  handleTransaction: provideHandleTransaction(REGISTRY_ADDRESS),
};
