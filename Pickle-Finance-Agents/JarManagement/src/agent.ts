import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { pickleJarInterface } from "./abi";
import { getPickleJars, createFinding } from "./utils";
import { providers } from "ethers";

const PICKLE_FINANCE_REGISTRY = "0xF7C2DCFF5E947a617288792e289984a2721C4671";

export const provideHandleTransaction = (
  pickleRegistryAddress: string,
  provider: providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const pickleJars = await getPickleJars(
      pickleRegistryAddress,
      txEvent.blockNumber,
      provider
    );

    const managementCallsPerJar = pickleJars.map((pickleJar: string) =>
      txEvent.filterFunction(pickleJarInterface.format("minimal"), pickleJar)
    );

    for (let i = 0; i < pickleJars.length; i++) {
      const newFindings = managementCallsPerJar[i].map((managementCall) =>
        createFinding(
          pickleJars[i],
          managementCall.name,
          managementCall.args.toString()
        )
      );
      findings.push(...newFindings);
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(PICKLE_FINANCE_REGISTRY, getEthersProvider()),
};
