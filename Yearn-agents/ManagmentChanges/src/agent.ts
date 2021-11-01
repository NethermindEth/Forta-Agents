import {
    getJsonRpcUrl,
  HandleTransaction,
} from "forta-agent";
import { provideEventCheckerHandler } from "forta-agent-tools";
import {
  updateManagementSignature,
  updatePerformanceFeeSignature,
  updateManagementFeeSignature,
  createUpdateManagementFindingGenerator,
  createUpdateManagementFeeFindingGenerator,
  createUpdatePerformanceFeeFindingGenerator,
  getYearnVaults,
} from "./utils";
import Web3 from "web3";

const web3 = new Web3(getJsonRpcUrl());



export const provideHandleTransaction = (web3: Web3): HandleTransaction => {
  return async (txEvent) => {
  const yearnVaults: string[] = getYearnVaults(web3, txEvent.blockNumber);

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

  const handlers = updateManagementHandlers.concat(updateManagementFeeHandlers, updatePerformanceFeeHandlers);

  const findings = await Promise.all(handlers.map((handler) => handler(txEvent)));

  return findings.flat();
  }
}

export default {
  handleTransaction: provideHandleTransaction(web3),
};
