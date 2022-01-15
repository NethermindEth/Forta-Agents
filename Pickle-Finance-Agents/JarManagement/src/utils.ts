import { pickleRegistryInterface } from "./abi";
import { Contract, providers } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

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

export const createFinding = (
  pickleJarAddress: string,
  methodCalled: string,
  args: string
): Finding => {
  return Finding.fromObject({
    name: "Jar Management",
    description: "A management function was called in a Jar",
    alertId: "PICKLE-3",
    protocol: "Pickle Finance",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      pickleJar: pickleJarAddress,
      methodCalled: methodCalled,
      args: args,
    },
  });
};
