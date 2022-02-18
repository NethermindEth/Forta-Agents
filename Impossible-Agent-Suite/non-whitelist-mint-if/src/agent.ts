import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction,
} from 'forta-agent';

// Address of the Impossible Finance token contract
let IF_ADDR = '0xb0e1fc65c1a741b4662b813eb787d369b8614af1';
let ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// The whitelist
let WHITELIST: string[] = [];

// Impossible Finance token contract ABI with relevant events/functions
export const IF_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export const provideHandleTransaction = (
  address: string,
  whitelist: string[]
): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];
    // Get all `Transfer` events emitted from `IF_ADDR`
    const transfers = tx.filterLog(IF_ABI[0], address);
    // For each address
    transfers.forEach((transfer) => {
      // If the `from` address is the zero address
      if(transfer.args.from == ZERO_ADDR) {
        // If the `to` address is not in the whitelist
        if(!whitelist.includes(transfer.args.to.toLowerCase())) {
          // Create a finding
          findings.push(
            Finding.fromObject({
              name: 'IF token non-whitelist mint',
              description: 'Impossible Finance tokens have been minted to a non-whitelisted address',
              alertId: 'IMPOSSIBLE-2-1',
              severity: FindingSeverity.High,
              type: FindingType.Suspicious,
              protocol: 'Impossible Finance',
              metadata: {
                receiver: transfer.args.to.toLowerCase(),
              }
            })
          );
        }
      }
    });
    // Return findings
    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(IF_ADDR, WHITELIST),
}
