import abi from './abi';
import findings from './findings';
import { TransactionEvent } from 'forta-agent'

const NAFTA_ADDRESS = "0x98e4c5d0dd486355b261c78ea8213cb8875ac800";

export const provideHandleTransaction = (naftaAddress: string) =>
  async (txEvent: TransactionEvent) => 
    txEvent.filterLog(abi.NAFTA, naftaAddress).map(findings.resolver);

export default {
  handleTransaction: provideHandleTransaction(NAFTA_ADDRESS),
};
