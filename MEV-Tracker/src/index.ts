import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import axios from 'axios';

const INTERESTING_PROTOCOLS: string[] = [];
const API_ENDPOINT: string = "ttps://blocks.flashbots.net/v1/blocks?block_number=";

const provideHandleTransaction = (
  getter: any, 
  protocols: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const protocolsInUse: string[] = protocols.filter(
      (p: string) => txEvent.addresses[p]
    );

    if(protocolsInUse.length === 0) return findings;

    const { data } = await getter(`${API_ENDPOINT}${txEvent.block}`);

    // check if the block has a bundle
    if(data.blocks.length === 0) return findings;

    // check if the transaction is inside the bundle
    const currentTxn = data.block[0].transactions.filter(
      (txn: any) => txn.transaction_hash === txEvent.hash
    );
    if(currentTxn.length === 0) return findings;
    const txn = currentTxn[0];

    // report findings
    protocolsInUse.forEach(
      (p: string) => {
        findings.push(
          Finding.fromObject({
            name: "Protocol interaction inside a MEV bundle",
            description: `Protocol used (${p})`,
            alertId: "NETHERMIND-AGENTS-10",
            type: FindingType.Suspicious,
            severity: FindingSeverity.Info,
            metadata: {
              bundle_type: txn.bundle_type,
            },
          })
        );
      }
    )
  
    return findings;
  }
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(axios.get, INTERESTING_PROTOCOLS),
};
