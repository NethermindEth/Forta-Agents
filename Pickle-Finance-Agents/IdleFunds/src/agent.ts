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
const TIME_WINDOW = 21600; // 6 hours

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
  timeWindow: number,
  provider: providers.Provider
): HandleBlock => {
  const lastTimeReported: { [key: string]: number } = {};

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const pickleJars = await getPickleJars(
      pickleRegistryAddress,
      blockEvent.blockNumber,
      provider
    );

    const jarsToReport = pickleJars.filter(
      (jar) =>
        lastTimeReported[jar] === undefined ||
        blockEvent.block.timestamp - lastTimeReported[jar] >= timeWindow
    );

    const findingsPromises = jarsToReport.map((pickleJar: string) =>
      getFindingsForAJar(pickleJar, threshold, blockEvent.blockNumber, provider)
    );

    const findingsBatches = await Promise.all(findingsPromises);

    const findings = findingsBatches.flat();

    for (let finding of findings) {
      lastTimeReported[finding.metadata.pickleJar] = blockEvent.block.timestamp;
    }
    
    return findingsBatches.flat();
  };
};

export default {
  handleBlock: providerHandleBlock(
    PICKLE_FINANCE_REGISTRY,
    THRESHOLD,
    TIME_WINDOW,
    getEthersProvider()
  ),
};
