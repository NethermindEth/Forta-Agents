import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from 'forta-agent';

const { ethers } = require('ethers');

// Global variables
let PAIRS: string[] = [];
let SWAP_FACTORY_V1 = '0x16FCDd239bA1347cBa90A7acaA1e3c1F83444353';

// The initialize function
const initialize = async () => {
  let provider;

  // If testing then manually setup BSC provider, otherwise use the forta provider
  const isTesting: boolean = true;
  if(isTesting) {
    provider = ethers.getDefaultProvider('https://bsc-dataseed.binance.org/');
  } else {
    provider = getEthersProvider();
  }

  // The abi of the Swap Factory V1 contract
  const abi = [
    "function allPairs(uint) external view returns (address pair)",
    "function allPairsLength() external view returns (uint)",
  ]
  // Read only contract instance
  const contract = new ethers.Contract(SWAP_FACTORY_V1, abi, provider);
  // Get the number of pairs
  let numPairs = await contract.allPairsLength();

  // Get all pair addresses
  let i = ethers.BigNumber.from(0);
  while(i.lt(numPairs)) {
    // Get item and add it to the array
    pairs[i] = await contract.allPairs(i.toString());
    console.log('pair ' + i.add('1').toString() + ' out of ' + numPairs.toString() + ' added: ' + pairs[i]);
    // Increment 
    i = i.add(ethers.BigNumber.from(1));
  }
}

// The handle transaction function
const handleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // Check if new pair has been deployed
  
  // Check if the function `swap` has been called with data size > 0
  

  return findings;
}

// Export needed functions
export default {
  initialize,
  handleTransaction,
}
