import { pickleJarInterface, pickleRegistryInterface } from "./abi";
import { Contract, providers, BigNumber } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

const jarNames: { [key: string]: string } = {};

export const getPickleJars = async (
  pickleRegistryAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<string[]> => {
  const pickleRegistry = new Contract(
    pickleRegistryAddress,
    pickleRegistryInterface,
    provider
  );

  const developmentVaultsPromise: Promise<string[]> =
    pickleRegistry.developmentVaults({ blockTag: blockNumber });
  const productionVaultsPromise: Promise<string[]> =
    pickleRegistry.productionVaults({ blockTag: blockNumber });

  return (await developmentVaultsPromise).concat(await productionVaultsPromise);
};

export const getPickleJarName = async (
  pickleJarAddress: string,
  provider: providers.Provider
): Promise<string> => {
  const pickleJar = new Contract(
    pickleJarAddress,
    pickleJarInterface,
    provider
  );

  let name = jarNames[pickleJarAddress];

  if (name === undefined) {
    jarNames[pickleJarAddress] = await pickleJar.name();
  }
  return jarNames[pickleJarAddress];
};

export const getPickleJarsBalance = async (
  pickleJarAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const pickleJar = new Contract(
    pickleJarAddress,
    pickleJarInterface,
    provider
  );

  const name = await getPickleJarName(pickleJarAddress, provider);

  if (name.indexOf("Uni v3") != -1) {
    return pickleJar.totalLiquidity({ blockTag: blockNumber });
  }

  return pickleJar.balance({ blockTag: blockNumber });
};

export const getPickleJarsAvailable = async (
  pickleJarAddress: string,
  blockNumber: number,
  provider: providers.Provider
): Promise<BigNumber> => {
  const pickleJar = new Contract(
    pickleJarAddress,
    pickleJarInterface,
    provider
  );

  const name = await getPickleJarName(pickleJarAddress, provider);

  if (name.indexOf("Uni v3") != -1) {
    return pickleJar.liquidityOfThis({ blockTag: blockNumber });
  }

  return pickleJar.available({ blockTag: blockNumber });
};

export const createFinding = (
  pickleJar: string,
  idleFundsPercent: string
): Finding => {
  return Finding.fromObject({
    name: "Idle Funds",
    description: "A pickle jar has a big amount of idle funds",
    alertId: "PICKLE-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Pickle Finance",
    metadata: {
      pickleJar: pickleJar,
      idleFundsPercent: idleFundsPercent,
    },
  });
};
