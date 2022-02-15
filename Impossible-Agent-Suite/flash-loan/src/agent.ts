import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from 'forta-agent';

const { ethers } = require('ethers');

let SWAP_FACTORY_ADDRESS= '0x918d7e714243f7d9d463c37e106235dcde294ffc';

export const SWAP_FACTORY_ABI = [
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];

export const PAIR_SWAP_ABI = [
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)',
  'function factory() external view returns (address)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

// Receives the address of a contract with same ABI as PAIR_SWAP_ABI and returns the factory address
export const getContractFactory = async (swapContract: string) => {
  const provider = getEthersProvider();
  const contractInterface = new ethers.Contract(swapContract, PAIR_SWAP_ABI, provider);
  return await contractInterface.factory();
}

export const provideHandleTransaction = (
  address: string,
  getContractFactory: any,
): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Set up the findings array
    const findings: Finding[] = [];

    // Get addresses of all contracts that emitted a `Swap` event
    let swapContracts: string[] = [];
    const swapLogs = tx.filterLog(PAIR_SWAP_ABI[0]);
    swapLogs.forEach((swapLog) => {
      // If the address is already in the array then don't add
      if(swapContracts.indexOf(swapLog.address) === -1) {
        swapContracts.push(swapLog.address);
      }
    });

    // For each potential address
    await Promise.all(swapContracts.map(async (swapContract) => {
      // Get all times the `swap` function was called on the contract `swapContract`
      const swapCalls = tx.filterFunction(PAIR_SWAP_ABI[1], swapContract);
      // For each swapCall
      await Promise.all(swapCalls.map(async (swapCall) => {
        if(ethers.BigNumber.from(swapCall.args.data).gt(ethers.BigNumber.from('0'))) {
          // If the contract factory address is `SWAP_FACTORY_ADDRESS`
          const contractFactory = await getContractFactory(swapContract);
          if(contractFactory == address) {
            // Create a finding
            findings.push(
              Finding.fromObject({
                name: 'Flash Loan Detected',
                description: 'A flash loan has been executed on an Impossible Finance StableXSwap contract',
                alertId: 'IMPOSSIBLE-5',
                severity: FindingSeverity.Info,
                type: FindingType.Info,
                protocol: 'Impossible Finance',
                metadata: {
                  amount0Out: swapCall.args.amount0Out.toString(),
                  amount1Out: swapCall.args.amount1Out.toString(),
                  to: swapCall.args.to.toLowerCase(),
                  data: ethers.BigNumber.from(swapCall.args.data).toHexString(),
                },
              })
            );
          }
        }
      }));
    }));

    // Return findings
    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(SWAP_FACTORY_ADDRESS, getContractFactory),
}
