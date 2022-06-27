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

  const balancerId = ethers.utils.formatBytes32String("balancer.eth");
  const topics = [delegateRegistryIface.getEventTopic("SetDelegate"), null, balancerId];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = (
      await provider.getLogs({
        address: config.delegateRegistryAddress,
        topics,
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((log) => delegateRegistryIface.parseLog(log));

    await Promise.all(
      logs.map(async (log) => {
        const delegatedAmount: ethers.BigNumber = await veBal.balanceOf(log.args.delegator, {
          blockTag: blockEvent.blockNumber,
        });

        if (config.absoluteThreshold !== undefined && delegatedAmount.gte(config.absoluteThreshold)) {
          findings.push(createAbsoluteThresholdFinding(log, delegatedAmount));
        }

        if (config.supplyPercentageThreshold !== undefined) {
          const totalSupply: ethers.BigNumber = await veBal.totalSupply({
            blockTag: blockEvent.blockNumber,
          });
          const supplyPercentage = toBn(delegatedAmount).shiftedBy(2).div(toBn(totalSupply));

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
