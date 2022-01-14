import { pickleJarInterface, pickleRegistryInterface } from "./abi";
import { Contract, providers } from "ethers";

export const getPickleJars = async (pickleRegistryAddress: string, blockNumber: number, provider: providers.Provider): Promise<string[]> => {
  const pickleRegistry = new Contract(pickleRegistryAddress, pickleRegistryInterface, provider);

  const developmentVaultsPromise: Promise<string[]> = pickleRegistry.developmentVaults({ blockTag: blockNumber });
  const productionVaultsPromise: Promise<string[]>  = pickleRegistry.productionVaults({ blockTag: blockNumber });

  return (await developmentVaultsPromise).concat(await productionVaultsPromise);
}
