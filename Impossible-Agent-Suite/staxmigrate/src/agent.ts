import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction
} from 'forta-agent';

let IF_ADDR = '0xb0e1fc65c1a741b4662b813eb787d369b8614af1';
let ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export const IF_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function staxMigrate(uint amount)'
];

export const provideHandleTransaction = (address: string): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];

    // Get all times `Transfer` was emitted
    const transfers = tx.filterLog(IF_ABI[0], address);

    // Get all times `staxMigrate` was called
    const migrations = tx.filterFunction(IF_ABI[1], address);

    // For each `staxMigrate` call
    migrations.forEach((migration) => {
      // For each `Transfer` event
      transfers.forEach((transfer) => {
        // Check if the `Transfer` event is a mint
        if(transfer.args.from == ZERO_ADDR) {
          // Get the amount of STAX tokens that are going 'in'
          const staxAmountIn = migration.args.amount.toString();
          const ifAmountOut = transfer.args.value.toString();
          // If `staxAmountIn` and `ifAmountOut` are different 
          if(staxAmountIn != ifAmountOut) {
            // Create a finding
            findings.push(
              Finding.fromObject({
                name: 'IF token staxMigrate imbalanced mint',
                description: 'staxMigrate was called and an unexpected amount of IF tokens have been minted',
                alertId: 'IMPOSSIBLE-10',
                severity: FindingSeverity.High,  
                type: FindingType.Exploit,
                protocol: 'Impossible Finance',
                metadata: {
                  receiver: transfer.args.to.toLowerCase(),
                  staxAmountIn: staxAmountIn,
                  ifAmountOut: ifAmountOut
                }
              })
            );
          }
        }
      });
    });

    // Return findings
    return findings;
  }
}
