import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction,
} from 'forta-agent';

import {
  Verifier,
  IF_WHITELIST_VERIFIER,
  IDIA_WHITELIST_VERIFIER,
} from './verifier';

// Address of the Impossible Finance token contract
const IF_ADDR = '0xb0e1fc65c1a741b4662b813eb787d369b8614af1';
const IDIA_ADDR = '0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89';
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// Array containing a token address and its respective whitelist verifier function
// address, verifier, symbol, alertId
const TOKENS: [string, Verifier, string, string][] = [
  [
    IF_ADDR,
    IF_WHITELIST_VERIFIER,
    'IF',
    'IMPOSSIBLE-2-1'
  ],
  [
    IDIA_ADDR,
    IDIA_WHITELIST_VERIFIER,
    'IDIA',
    'IMPOSSBILE-2-2'
  ]
];

// Impossible Finance token contract ABI with relevant events/functions
export const IF_ABI= [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function staxMigrate(uint amount)'
];

export const provideHandleTransaction = (tokens: [string, Verifier, string, string][]): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];

    // For each token in `tokens`
    await Promise.all(tokens.map(async (tokendata) => {
      // Unpack `tokendata` for readability
      const tokenAddress = tokendata[0];
      const verifierFunction = tokendata[1];
      const tokenSymbol = tokendata[2];
      const alertId = tokendata[3];
      // If `staxMigrate` has not been called
      const migrateCalls = tx.filterFunction(IF_ABI[1], tokenAddress);
      if(migrateCalls.length == 0) {
        // Get all `Transfer` events emitted from `tokenAddress`
        const transfers = tx.filterLog(IF_ABI[0], tokenAddress);
        // For each transfer
        await Promise.all(transfers.map(async (transfer) => {
          // If the `from` address is the zero address
          if(transfer.args.from == ZERO_ADDR) {
            // This transfer is a mint so run the verifier on the recipient address
            const whitelisted = await verifierFunction(transfer.args.from);
            // If `whitelisted` is false then the address is not in the whitelist
            if(!whitelisted) {
              // Create a finding
              findings.push(
                Finding.fromObject({
                  name: tokenSymbol + ' token non-whitelist mint',
                  description: tokenSymbol + ' tokens have been minted to a non-whitelisted address',
                  alertId: alertId,
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
        }));
      }
    }));

    // Return findings
    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(TOKENS),
}
