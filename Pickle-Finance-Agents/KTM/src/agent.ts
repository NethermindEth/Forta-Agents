import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";
import {
  getExecuteGasAndBalance,
  getMinimumBalance,
  createHighFinding,
  createInfoFinding,
} from "./utils";
import DataWindows from "./data.windows";
import { BigNumber, providers } from "ethers";

const KEEPER_REGISTRY_ADDRESS = "0x7b3EC232b08BD7b4b3305BE0C044D907B2DF960B";
const KEEPER_INDEX = 28;
const INFO_THRESHOLD = 25;
const HIGH_THRESHOLD = 10;
const WINDOWS_SIZE = 1000;

export const provideHandleTransaction = (
  highThreshold: number,
  infoThreshold: number,
  windowsSize: number,
  keeperRegistryAddress: string,
  keeperIndex: number,
  provider: providers.Provider
): HandleTransaction => {
  const dataFeed = new DataWindows(windowsSize);
  let lastBlock = 0;

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    dataFeed.addElement(BigNumber.from(txEvent.gasPrice));

    const performUpkeepCalls = txEvent.filterFunction(
      "function performUpkeep(uint256 index, bytes performData) external returns (bool)",
      keeperRegistryAddress
    );

    const relevantKeeperCalled = performUpkeepCalls.some((call) =>
      call.args["index"].eq(28)
    );

    if (relevantKeeperCalled) {
      const [[executeGas, balance], minimumBalance] = await Promise.all([
        getExecuteGasAndBalance(
          keeperRegistryAddress,
          keeperIndex,
          txEvent.blockNumber,
          provider
        ),
        getMinimumBalance(
          keeperRegistryAddress,
          keeperIndex,
          txEvent.blockNumber,
          provider
        ),
      ]);
      const estimatedGasPrice = dataFeed.getMean();
      if (estimatedGasPrice.eq(0)) {
        // No data to estimate has been collected
        return [];
      }

      const estimatedCallCost = executeGas.mul(estimatedGasPrice);
      const remainingBalance = balance.sub(minimumBalance);
      const remainingCalls = remainingBalance.div(estimatedCallCost);

      if (
        remainingCalls.lte(highThreshold) &&
        txEvent.blockNumber > lastBlock
      ) {
        lastBlock = txEvent.blockNumber;
        return [
          createHighFinding(remainingCalls.toString(), balance.toString()),
        ];
      }

      if (
        remainingCalls.lte(infoThreshold) &&
        txEvent.blockNumber > lastBlock
      ) {
        lastBlock = txEvent.blockNumber;
        return [
          createInfoFinding(remainingCalls.toString(), balance.toString()),
        ];
      }
    }

    return [];
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    HIGH_THRESHOLD,
    INFO_THRESHOLD,
    WINDOWS_SIZE,
    KEEPER_REGISTRY_ADDRESS,
    KEEPER_INDEX,
    getEthersProvider()
  ),
};
