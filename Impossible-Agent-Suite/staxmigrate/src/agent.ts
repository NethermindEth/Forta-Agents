import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction
} from 'forta-agent';

const IF_ADDR = '0xb0e1fc65c1a741b4662b813eb787d369b8614af1';
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export const IF_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function staxMigrate(uint amount)'
];

export const provideHandleTransaction = (address: string): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];

    // Get all times `staxMigrate` was called
    const migrations = tx.filterFunction(IF_ABI[1], address);
    
    // Get all times `Transfer` was emitted
    const transfers = tx.filterLog(IF_ABI[0], address);

    // For each `transfer` event
    transfers.forEach((transfer) => {
      // If it is a mint transfer
      if(transfer.args.from == ZERO_ADDR) {
        // Attempt to find a matching `staxMigrate` call
        let i = 0;
        let matchingMigrate = false;
        while(i < migrations.length) {
          // Get the amount 'in' STAX tokens and 'out' IF tokens
          const staxAmountIn = migrations[i].args.amount.toString();
          const ifAmountOut = transfer.args.value.toString();
          // If amount in and out match
          if(staxAmountIn == ifAmountOut) {
            // The `staxMigrate` call matches the `transfer` event
            matchingMigrate = true;
            // Remove the matching `staxMigrate` call so it can't be matched again
            migrations.splice(i, 1);
            // Exit the loop
            break;
          }
          i++;
        }
        // If a matching transfer mint for the `staxMigrate` call was not found
        if(matchingMigrate == false) {
          findings.push(
            Finding.fromObject({
              name: 'IF token staxMigrate imbalanced mint',
              description: 'staxMigrate was called and an unexpected amount of IF tokens have been minted',
              alertId: 'IMPOSSIBLE-10',
              severity: FindingSeverity.High,  
              type: FindingType.Exploit,
              protocol: 'Impossible Finance',
              metadata: {
                receiver: transfer.args.to.toString().toLowerCase(),
                ifAmountOut: transfer.args.value.toString()
              }
            })
          );
        }
      }
    });
    
    /*
    // If there were calls to the `staxMigrate` function 
    if(migrations.length) {

      // For each `staxMigrate` call
      migrations.forEach((migration) => {

        // Cycle through all transfer events
        let i = 0;
        let matchingTransfer = false;
        while(i < transfers.length) {
          // If the transfer is a mint
          if(transfers[i].args.from == ZERO_ADDR) {
            // Get the amount 'in' STAX tokens and 'out' IF tokens
            const staxAmountIn = migration.args.amount.toString();
            const ifAmountOut = transfers[i].args.value.toString();
            // If `staxAmountIn` and `ifAmountOut` match
            if(staxAmountIn == ifAmountOut) {
              // The `staxMigrate` call matches the `transfer` event
              matchingTransfer = true;
              // Exit while loop
              break;
            }
          }
          // Increment i
          i++;
        } 
  
        console.log(migration);
        
        // If a matching transfer mint for the `staxMigrate` call was not found
        if(matchingTransfer == false) {



          findings.push(
            Finding.fromObject({
              name: 'IF token staxMigrate imbalanced mint',
              description: 'staxMigrate was called and an unexpected amount of IF tokens have been minted',
              alertId: 'IMPOSSIBLE-10',
              severity: FindingSeverity.High,  
              type: FindingType.Exploit,
              protocol: 'Impossible Finance',
              metadata: {
                staxAmountIn: migration.args.amount.toString()
              }
            })
          );
        }
      });
    }
    */

    // Return findings
    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    IF_ADDR
  )
}
