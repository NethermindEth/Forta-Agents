import { keeperInterface, strategyInterface } from "./abi";
import { providers, Contract, utils } from "ethers";

export const getStrategies = async (keeperAddress: string, blockNumber: number, provider: providers.Provider): Promise<string[]> => {
  const keeperContract = new Contract(keeperAddress, keeperInterface, provider);
  const strategiesPromises: Promise<string>[] = [];

  const arrayLengthEncoded = await provider.getStorageAt(keeperAddress, 0, blockNumber);
  const arrayLength = utils.defaultAbiCoder.decode(["uint256"], arrayLengthEncoded)[0];

  for (let i = 0; i < arrayLength; i++) {
    strategiesPromises.push(keeperContract.strategyArray(i, { blockTag: blockNumber })); 
  }

  return Promise.all(strategiesPromises);
}
