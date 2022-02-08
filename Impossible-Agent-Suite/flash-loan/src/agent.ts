import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
  FindingSeverity,
  FindingType,
} from 'forta-agent';

const { ethers } = require('ethers');

// Global variables
const PAIRS: Set<string> = new Set<string>();
let SWAP_FACTORY_V1_ADDRESS = '0x918d7e714243F7d9d463C37e106235dCde294ffC';
export const SWAP_FACTORY_V1_ABI = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)",
]
export const PAIR_SWAP_ABI = [
  'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)',
]

const initialize = async () => {
  // Interact with the Swap Factory contract to get the total number of pairs
  const provider = getEthersProvider();
  const contract = new ethers.Contract(SWAP_FACTORY_V1_ADDRESS, SWAP_FACTORY_V1_ABI, provider);
  const numPairs = await contract.allPairsLength();
  let i = ethers.BigNumber.from(0);
  // Get each pair address and add it to the array `PAIRS`
  while(i.lt(numPairs)) {
    PAIRS.add(await contract.allPairs(i.toString()));
    console.log(i.add(1).toString() + '/' + numPairs.toString());
    i = i.add(ethers.BigNumber.from(1));
  }
}

export const provideHandleTransaction = (
  address: string,
  pairs: Set<string>,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Set up the findings array
    const findings: Finding[] = [];
    // Check if new pair has been deployed
    const pairCreatedEvents = txEvent.filterLog(SWAP_FACTORY_V1_ABI[0], address);
    for(let i = 0; i < pairCreatedEvents.length; i++) {
      // Get the newly created pair address and add it to the `pairs` array
      pairs.add(pairCreatedEvents[i].args.pair);
    }
    pairs.forEach((pair) => {
      // Get all times `swap` has been called on the pair
      const pairSwaps = txEvent.filterFunction(PAIR_SWAP_ABI[0], pair);
      // For every `swap` function call
      pairSwaps.forEach((pairswap) => {
        // Get the argument call data
        const amount0Out = pairswap.args.amount0Out;
        const amount1Out = pairswap.args.amount1Out;
        const to = pairswap.args.to;
        const data = ethers.BigNumber.from(pairswap.args.data);
        // If `data` is non-zero then it is a flashloan
        if(data.gt(ethers.BigNumber.from('0'))) {
          // Create a finding
          findings.push(
            Finding.fromObject({
              name: 'Flash Loan Detected',
              description: 'A flash loan has been made on a StableXSwap contract',
              alertId: 'IMPOSSIBLE-5',
              severity: FindingSeverity.Info,
              type: FindingType.Info,
              protocol: 'Impossible Finance',
              metadata: {
                amount0Out: amount0Out.toString(),
                amount1Out: amount1Out.toString(),
                to: to,
                data: data.toHexString() 
              }
            })
          );
        }
      });
    });
    return findings;
  }
}

// Export needed functions
export default {
  initialize,
  handleTransaction: provideHandleTransaction(
    SWAP_FACTORY_V1_ADDRESS,
    PAIRS,
  ),
}
