import BigNumber from "bignumber.js";
import { ethers, Finding, getEthersProvider, HandleBlock, BlockEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { BALANCE_OF_ABI, SET_DELEGATE_ABI, TOTAL_SUPPLY_ABI } from "./constants";
import { createAbsoluteThresholdFinding, createPercentageThresholdFinding } from "./finding";
import { AgentConfig, SmartCaller, toBn } from "./utils";

BigNumber.set({ DECIMAL_PLACES: 18 });

export const provideHandleBlock = (config: AgentConfig, provider: ethers.providers.Provider): HandleBlock => {
  const delegateRegistryIface = new ethers.utils.Interface([SET_DELEGATE_ABI]);
  const veBal = SmartCaller.from(
    new ethers.Contract(config.veBalTokenAddress, [BALANCE_OF_ABI, TOTAL_SUPPLY_ABI], provider)
  );

  const topics = [delegateRegistryIface.getEventTopic("SetDelegate")];
  const balancerId = ethers.utils.formatBytes32String("balancer.eth");

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const timestamp = blockEvent.block.timestamp;

    const logs = await provider.getLogs({
      address: config.delegateRegistryAddress,
      topics,
      fromBlock: blockEvent.blockNumber,
      toBlock: blockEvent.blockNumber,
    });

    const parsedLogs = logs
      .map((log) => delegateRegistryIface.parseLog(log))
      .filter((log) => log.args.id === balancerId);

    await Promise.all(
      parsedLogs.map(async (log) => {
        const delegatedAmount: ethers.BigNumber = await veBal.balanceOf(log.args.delegator, timestamp, {
          blockTag: blockEvent.blockNumber,
        });

        if (config.absoluteThreshold !== undefined && delegatedAmount.gte(config.absoluteThreshold)) {
          findings.push(createAbsoluteThresholdFinding(log, delegatedAmount));
        }

        if (config.supplyPercentageThreshold !== undefined) {
          const totalSupply: ethers.BigNumber = await veBal.totalSupply(timestamp, {
            blockTag: blockEvent.blockNumber,
          });
          const supplyPercentage = toBn(delegatedAmount).shiftedBy(2).div(toBn(totalSupply));

          console.debug(totalSupply.toString());

          if (supplyPercentage.gte(config.supplyPercentageThreshold)) {
            findings.push(createPercentageThresholdFinding(log, delegatedAmount, supplyPercentage));
          }
        }
      })
    );

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(CONFIG, getEthersProvider()),
};
