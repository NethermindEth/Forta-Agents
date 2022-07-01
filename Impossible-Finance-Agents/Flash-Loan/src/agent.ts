import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

import { ethers } from "ethers";

import LRU from "lru-cache";
import { PAIR_SWAP_ABI, SWAP_FACTORY_ABI, SWAP_FACTORY_ADDRESS } from "./utils";

const cache: LRU<string, boolean> = new LRU<string, boolean>({ max: 10000 });

// Receives the address of a pair and returns true if the factory is `swapFactoryAddress`
export const checkFromFactory = async (
  swapContract: string,
  swapFactoryAddress: string
) => {
  let isFromFactory;
  // If the contract exists in the cache
  if (cache.has(swapContract)) {
    // Get data from cache
    isFromFactory = cache.get(swapContract);
  } else {
    // Otherwise if the cache does not contain data for `swapContract`
    try {
      // Query the smart contract for its tokens
      const provider = getEthersProvider();
      const contractInterface = new ethers.Contract(
        swapContract,
        PAIR_SWAP_ABI,
        provider
      );
      const token0 = await contractInterface.token0();
      const token1 = await contractInterface.token1();
      // Query the factory to see if the token pairs point to the contract address
      const factoryInterface = new ethers.Contract(
        swapFactoryAddress,
        SWAP_FACTORY_ABI,
        provider
      );
      const pairAddress = await factoryInterface.getPair(token0, token1);
      // If the returned pair matches `swapContract` then add to the cache
      if (pairAddress.toLowerCase() == swapContract.toLowerCase()) {
        cache.set(swapContract, true);
        isFromFactory = true;
      } else {
        cache.set(swapContract, false);
        isFromFactory = false;
      }
    } catch (error) {
      // If the query fails
      cache.set(swapContract, false);
      isFromFactory = false;
    }
  }
  return isFromFactory;
};

export const provideHandleTransaction = (
  swapFactoryAddress: string,
  checkFromFactory: any
): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Set up the findings array
    const findings: Finding[] = [];

    // Get addresses of all contracts that emitted a `Swap` event
    let swapContracts: string[] = [];
    const swapLogs = tx.filterLog(PAIR_SWAP_ABI[0]);
    swapLogs.forEach((swapLog) => {
      // If the address is already in the array then don't add
      if (swapContracts.indexOf(swapLog.address) === -1) {
        swapContracts.push(swapLog.address);
      }
    });

    // For each potential address
    await Promise.all(
      swapContracts.map(async (swapContract) => {
        // Get all times the `swap` function was called on the contract `swapContract`
        const swapCalls = tx.filterFunction(PAIR_SWAP_ABI[1], swapContract);

        // For each swapCall
        await Promise.all(
          swapCalls.map(async (swapCall) => {
            // Get the calldata for the swap
            let data = swapCall.args.data;
            // If there is no data a zero must be added to the end
            if (data == "0x") {
              data = data + "0";
            }
            if (ethers.BigNumber.from(data).gt(ethers.BigNumber.from("0"))) {
              // If the contract is from the factory `SWAP_FACTORY_ADDRESS`
              const isFromFactory = await checkFromFactory(
                swapContract,
                swapFactoryAddress
              );

              if (isFromFactory) {
                // Create a finding
                findings.push(
                  Finding.fromObject({
                    name: "Flash Loan Detected",
                    description:
                      "A flash loan has been executed on an Impossible Finance StableXSwap contract",
                    alertId: "IMPOSSIBLE-5",
                    severity: FindingSeverity.Info,
                    type: FindingType.Info,
                    protocol: "Impossible Finance",
                    metadata: {
                      amount0Out: swapCall.args.amount0Out.toString(),
                      amount1Out: swapCall.args.amount1Out.toString(),
                      to: swapCall.args.to.toLowerCase(),
                      data: swapCall.args.data.toString(),
                    },
                  })
                );
              }
            }
          })
        );
      })
    );

    // Return findings
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    SWAP_FACTORY_ADDRESS,
    checkFromFactory
  ),
};
