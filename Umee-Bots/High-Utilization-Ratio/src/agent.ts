import BigNumber from "bignumber.js";
import {
  BlockEvent,
  ethers,
  Finding,
  getEthersProvider,
  HandleBlock,
  HandleTransaction,
  Initialize,
  TransactionEvent,
} from "forta-agent";
import CONFIG from "./agent.config";
import { GET_RESERVES_LIST_ABI, GET_RESERVE_DATA_ABI, RESERVE_INITIALIZED_ABI } from "./constants";
import { MulticallProvider } from "./multicall";
import {
  AgentConfig,
  arrayChunks,
  createAbsoluteThresholdFinding,
  createPercentageThresholdFinding,
  createReserveData,
  ReserveBalances,
  ReserveData,
  usageRatio,
} from "./utils";

BigNumber.set({ DECIMAL_PLACES: 18 });

const reserveData: ReserveData[] = [];
let multicallProvider: MulticallProvider = new MulticallProvider(getEthersProvider());

export const provideInitialize = (
  reserveData: ReserveData[],
  provider: ethers.providers.Provider,
  config: AgentConfig
): Initialize => {
  return async () => {
    const lendingPool = new ethers.Contract(
      config.lendingPoolAddress,
      [GET_RESERVES_LIST_ABI, GET_RESERVE_DATA_ABI],
      provider
    );

    const reserveAddresses: string[] = await lendingPool.getReservesList();
    const reserves = await Promise.all(
      reserveAddresses.map((reserveAddress) => lendingPool.getReserveData(reserveAddress))
    );

    reserves.forEach((data, idx) => {
      reserveData.push(
        createReserveData(
          reserveAddresses[idx],
          data.uTokenAddress,
          data.stableDebtTokenAddress,
          data.variableDebtTokenAddress
        )
      );
    });

    multicallProvider = new MulticallProvider(provider);
    await multicallProvider.init();
  };
};

export const provideHandleTransaction = (reserveData: ReserveData[], config: AgentConfig): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const reserveInits = txEvent.filterLog(RESERVE_INITIALIZED_ABI, config.lendingPoolConfiguratorAddress);

    reserveInits.forEach((reserveInit) => {
      reserveData.push(
        createReserveData(
          reserveInit.args.asset,
          reserveInit.args.uToken,
          reserveInit.args.stableDebtToken,
          reserveInit.args.variableDebtToken
        )
      );
    });

    return [];
  };
};

export const provideHandleBlock = (
  reserveData: ReserveData[],
  multicallProvider: MulticallProvider,
  config: AgentConfig
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // make one multicall for each chunk of 10 reserves
    const multicalls = arrayChunks(reserveData, 10).map((chunk) => {
      return multicallProvider.all(
        chunk.flatMap((reserve) => [
          reserve.asset.balanceOf(reserve.uTokenAddress),
          reserve.stableDebtToken.totalSupply(),
          reserve.variableDebtToken.totalSupply(),
        ]),
        blockEvent.blockNumber
      );
    });

    // divide into chunks of 3 later since each reserve needs 3 calls
    const data = arrayChunks((await Promise.all(multicalls)).flat(), 3) as ReserveBalances[];

    const usageRatios = data.map((chunk) => usageRatio(...chunk));
    const timestamp = blockEvent.block.timestamp;

    reserveData.forEach((reserve, idx) => {
      const currentUsageRatio = usageRatios[idx];
      const lastUsageRatio = reserve.usageRatio;

      reserve.usageRatio = currentUsageRatio;

      if (config.absoluteThreshold && currentUsageRatio.gte(config.absoluteThreshold)) {
        const notOnCooldown = timestamp - reserve.lastAlertTimestamp.absolute >= config.alertCooldown.absolute;

        if (notOnCooldown) {
          findings.push(createAbsoluteThresholdFinding(reserve.asset.address, currentUsageRatio));
          reserve.lastAlertTimestamp.absolute = timestamp;
        }
      }

      const percentageIncrease =
        currentUsageRatio.isZero() && lastUsageRatio.isZero()
          ? new BigNumber(0)
          : currentUsageRatio.div(lastUsageRatio).minus("1").shiftedBy(2);

      if (config.percentageThreshold && percentageIncrease.gte(config.percentageThreshold)) {
        const notOnCooldown = timestamp - reserve.lastAlertTimestamp.percentage >= config.alertCooldown.percentage;

        // the usage ratio is initialized as -1, so ignore percentage increases from that
        if (!lastUsageRatio.isNegative() && notOnCooldown) {
          findings.push(createPercentageThresholdFinding(reserve.asset.address, currentUsageRatio, percentageIncrease));
          reserve.lastAlertTimestamp.percentage = timestamp;
        }
      }
    });

    return findings;
  };
};

export default {
  provideInitialize,
  initialize: provideInitialize(reserveData, getEthersProvider(), CONFIG),
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(reserveData, CONFIG),
  provideHandleBlock,
  handleBlock: provideHandleBlock(reserveData, multicallProvider, CONFIG),
};
