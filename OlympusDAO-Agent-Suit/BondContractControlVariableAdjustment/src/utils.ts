import { Finding } from "forta-agent";
import { providers, utils, BigNumber, Contract } from "ethers";
import { redeemHelperInterface } from "./abi";

export const createFinding = (): Finding => {
  return undefined as any;
};

const getBondsLength = async (redeemHelperAddress: string, provider: providers.Provider): Promise<BigNumber>  => {
  const lengthEncoded = await provider.getStorageAt(redeemHelperAddress, 2);
  return utils.defaultAbiCoder.decode(["uint256"], lengthEncoded)[0];
};

const getBondAtIndex = async (redeemHelperAddress: string, index: BigNumber, provider: providers.Provider): Promise<string> => {
  const redeemHelperContract = new Contract(redeemHelperAddress, redeemHelperInterface, provider);
  return redeemHelperContract.bonds(index);
};

export const getBondsContracts = async (redeemHelperAddress: string, provider: providers.Provider): Promise<string[]> => {
  const getBondPromises: Promise<string>[] = []
  const length = await getBondsLength(redeemHelperAddress, provider);
  
  for (let i = BigNumber.from(0); i.lt(length); i = i.add(1)) {
    getBondPromises.push(getBondAtIndex(redeemHelperAddress, i, provider));
  }

  return Promise.all(getBondPromises);
};




