import BigNumber from "bignumber.js";
import { ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { BALANCE_OF_ABI, SET_DELEGATE_ABI, TOTAL_SUPPLY_ABI } from "./constants";
import { createAbsoluteThresholdFinding, createPercentageThresholdFinding } from "./finding";
import { AgentConfig, SmartCaller, toBn } from "./utils";

BigNumber.set({ DECIMAL_PLACES: 3 });

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider
): HandleTransaction => {
  const veBal = SmartCaller.from(
    new ethers.Contract(config.veBalTokenAddress, [BALANCE_OF_ABI, TOTAL_SUPPLY_ABI], provider)
  );

  const balancerId = ethers.utils.formatBytes32String("balancer.eth");

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent
      .filterLog([SET_DELEGATE_ABI], config.delegateRegistryAddress)
      .filter((log) => log.args.id == balancerId);

    if (!logs.length) return [];

    await Promise.all(
      logs.map(async (log) => {
        const delegatedAmount: ethers.BigNumber = await veBal.balanceOf(log.args.delegator, {
          blockTag: txEvent.blockNumber,
        });

        if (config.absoluteThreshold !== undefined && delegatedAmount.gte(config.absoluteThreshold)) {
          findings.push(createAbsoluteThresholdFinding(log, delegatedAmount));
        }

        if (config.supplyPercentageThreshold !== undefined) {
          const totalSupply: ethers.BigNumber = await veBal.totalSupply({
            blockTag: txEvent.blockNumber,
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
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
