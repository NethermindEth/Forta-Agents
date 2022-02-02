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
let PAIRS: string[] = [];
let SWAP_FACTORY_V1_ADDRESS = '0x918d7e714243F7d9d463C37e106235dCde294ffC';
const SWAP_FACTORY_V1_ABI = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)",
]

const initialize = async () => {
  // Different initialize logic when testing to save time
  // When testing is true then Ethereum network should be used and a pre-set PAIRS array is used
  const testing = false;
  if(testing) {
    // Set the contract address to the UniswapV2 address instead of the BSC Impossbile Finance factory address
    SWAP_FACTORY_V1_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
    PAIRS = [
      // THIS IS AN ETH ADDRESS FOR TESTING WITH USDC UNISWAP V2 PAIR
      '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
    ]
  } else {
    // Interact with the Swap Factory contract to get the total number of pairs
    const provider = getEthersProvider();
    const contract = new ethers.Contract(SWAP_FACTORY_V1_ADDRESS, SWAP_FACTORY_V1_ABI, provider);
    const numPairs = await contract.allPairsLength();
    let i = ethers.BigNumber.from(0);
    // Get each pair address and add it to the array `PAIRS`
    while(i.lt(numPairs)) {
      PAIRS[i] = await contract.allPairs(i.toString());
      const pairIndex = i.add(1).toString();
      console.log(i.add(1).toString() + '/' + numPairs.toString());
      i = i.add(ethers.BigNumber.from(1));
    }
  }
}

export const provideHandleTransaction = (
  alertId: string,
  address: string,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Set up the findings array
    const findings: Finding[] = [];
    // Check if new pair has been deployed
    const pairCreatedEvents = txEvent.filterLog(SWAP_FACTORY_V1_ABI[0], SWAP_FACTORY_V1_ADDRESS);
    for(let i = 0; i < pairCreatedEvents.length; i++) {
      // Get the newly created pair address and add it to the `PAIRS` array
      PAIRS.push(pairCreatedEvents[i].args.pair);
      console.log('New Pair Added: ' + PAIRS[PAIRS.length-1]);
    }
    // For each pair
    for(let i = 0; i < PAIRS.length; i++) {
      // Get all times `swap` has been called on the pair
      const pairSwapAbi = 'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)';
      const pairSwaps = txEvent.filterFunction(pairSwapAbi, PAIRS[i]);
      // For every `swap` function call
      for(let j = 0; j < pairSwaps.length; j++) {
        // Get argument call data
        const amount0Out = pairSwaps[j].args.amount0Out;
        const amount1Out = pairSwaps[j].args.amount1Out;
        const to = pairSwaps[j].args.to;
        const data = ethers.BigNumber.from(pairSwaps[j].args.data);
        // If `data` is non-zero then it is a flashloan
        if(data.gt(ethers.BigNumber.from('0'))) {
          // Create a finding
          findings.push(
            Finding.fromObject({
              name: 'Flash Loan Detected',
              description: 'A flash loan has been made on a StableXSwap contract',
              alertId: alertId,
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
      }
    }
    return findings;
  }
}

// Export needed functions
export default {
  initialize,
  handleTransaction: provideHandleTransaction(
    "IMPOSSIBLE-5",
    SWAP_FACTORY_V1_ADDRESS,
  )
}
