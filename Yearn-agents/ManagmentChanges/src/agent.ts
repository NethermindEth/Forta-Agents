import { getJsonRpcUrl, HandleTransaction } from "forta-agent";
import { provideEventCheckerHandler } from "forta-agent-tools";
import {
  updateManagementSignature,
  updatePerformanceFeeSignature,
  updateManagementFeeSignature,
  strategyAddedSignature,
  createUpdateManagementFindingGenerator,
  createUpdateManagementFeeFindingGenerator,
  createUpdatePerformanceFeeFindingGenerator,
  createAddStrategyFindingGenerator,
  getYearnVaults,
} from "./utils";
import { ethers } from "ethers";

const etherProvider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

export const provideHandleTransaction = (etherProvider: ethers.providers.JsonRpcProvider): HandleTransaction => {
  return async (txEvent) => {
    const yearnVaults: string[] = await getYearnVaults(etherProvider, txEvent.blockNumber);

    const updateManagementHandlers = yearnVaults.map((yearnVault: string) =>
      provideEventCheckerHandler(
        createUpdateManagementFindingGenerator(yearnVault),
        updateManagementSignature,
        yearnVault
      )
    );

    const updateManagementFeeHandlers = yearnVaults.map((yearnVault: string) =>
      provideEventCheckerHandler(
        createUpdateManagementFeeFindingGenerator(yearnVault),
        updateManagementFeeSignature,
        yearnVault
      )
    );

    const updatePerformanceFeeHandlers = yearnVaults.map((yearnVault: string) =>
      provideEventCheckerHandler(
        createUpdatePerformanceFeeFindingGenerator(yearnVault),
        updatePerformanceFeeSignature,
        yearnVault
      )
    );

    const addedStrategyHandlers = yearnVaults.map((yearnVault: string) =>
      provideEventCheckerHandler(createAddStrategyFindingGenerator(yearnVault), strategyAddedSignature, yearnVault)
    );

    const handlers = updateManagementHandlers.concat(
      updateManagementFeeHandlers,
      updatePerformanceFeeHandlers,
      addedStrategyHandlers
    );

    const findings = await Promise.all(handlers.map((handler) => handler(txEvent)));

    return findings.flat();
  };
};

export default {
  handleTransaction: provideHandleTransaction(etherProvider),
};
