import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
} from "forta-agent";
import { providers, BigNumberish } from "ethers";
import {
  getPickleJars,
  getPickleJarsBalance,
  getPickleJarsAvailable,
  createFinding,
} from "./utils";

const PICKLE_FINANCE_REGISTRY = "0xF7C2DCFF5E947a617288792e289984a2721C4671";
const THRESHOLD = 25;

const getFindingsForAJar = async (
  pickleJarAddress: string,
  threshold: BigNumberish,
  blockNumber: number,
  provider: providers.Provider
): Promise<Finding[]> => {
  const balancePromise = getPickleJarsBalance(
    pickleJarAddress,
    blockNumber,
    provider
  );
  const availablePromise = getPickleJarsAvailable(
    pickleJarAddress,
    blockNumber,
    provider
  );

  const percentIdle = (await availablePromise)
    .mul(100)
    .div(await balancePromise);

  if (percentIdle.lt(threshold)) {
    return [];
  }

  return [createFinding(pickleJarAddress, percentIdle.toString())];
};

export const providerHandleBlock = (
  pickleRegistryAddress: string,
  threshold: BigNumberish,
  provider: providers.Provider
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const pickleJars = await getPickleJars(
      pickleRegistryAddress,
      blockEvent.blockNumber,
      provider
    );
    const findingsPromises = pickleJars.map((pickleJar: string) =>
      getFindingsForAJar(pickleJar, threshold, blockEvent.blockNumber, provider)
    );
    const findingsBatches = await Promise.all(findingsPromises);

    return findingsBatches.flat();
  };
};

export default {
  handleBlock: providerHandleBlock(
    PICKLE_FINANCE_REGISTRY,
    THRESHOLD,
    getEthersProvider()
  ),
};
