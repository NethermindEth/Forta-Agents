import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { providers, utils, BigNumber, Contract } from "ethers";
import { redeemHelperInterface } from "./abi";
import LRU from "lru-cache";

const bondsCache: LRU<number, Promise<string[]>> = new LRU({ max: 10000 });

export const createFinding = (
  initialBCV: string,
  newBCV: string,
  adjustment: string,
  addition: string
): Finding => {
  return Finding.fromObject({
    name: "Bond Contract ControlVariableAdjustment Event",
    description:
      "A ControlVariableAdjustment event was emitted from a bond contract",
    alertId: "OlympusDAO-7",
    protocol: "OlympusDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      initialBCV: initialBCV,
      newBCV: newBCV,
      adjustment: adjustment,
      addition: addition,
    },
  });
};

const getBondsLength = async (
  redeemHelperAddress: string,
  block: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const lengthEncoded = await provider.getStorageAt(
    redeemHelperAddress,
    2,
    block
  );
  return utils.defaultAbiCoder.decode(["uint256"], lengthEncoded)[0];
};

const getBondAtIndex = async (
  redeemHelperAddress: string,
  index: BigNumber,
  block: number,
  provider: providers.Provider
): Promise<string> => {
  const redeemHelperContract = new Contract(
    redeemHelperAddress,
    redeemHelperInterface,
    provider
  );
  return redeemHelperContract.bonds(index, { blockTag: block });
};

export const getBondsContracts = async (
  redeemHelperAddress: string,
  block: number,
  provider: providers.Provider
): Promise<string[]> => {
  if (!bondsCache.has(block)) {
    const getBondPromises: Promise<string>[] = [];
    const length = await getBondsLength(redeemHelperAddress, block, provider);
    for (let i = BigNumber.from(0); i.lt(length); i = i.add(1)) {
      getBondPromises.push(
        getBondAtIndex(redeemHelperAddress, i, block, provider)
      );
    }

    bondsCache.set(block, Promise.all(getBondPromises));
  }
  return bondsCache.get(block) as Promise<string[]>;
};
