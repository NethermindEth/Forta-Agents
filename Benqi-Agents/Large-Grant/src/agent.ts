import { BigNumber, ethers } from "ethers";
import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { createFinding } from "./finding";
import {
  AgentConfig,
  COMPTROLLER_ADDRESS,
  QI_ADDRESS,
  QI_BALANCE_ABI,
  QI_GRANTED_ABI,
  QI_TOTAL_SUPPLY_ABI,
  ThresholdMode,
} from "./utils";

const QI_IFACE = new ethers.utils.Interface([QI_TOTAL_SUPPLY_ABI, QI_BALANCE_ABI]);

const provideIsLarge = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig,
  provider?: any
): ((value: BigNumber, block: number) => Promise<boolean>) => {
  const bnThreshold = BigNumber.from(agentConfig.threshold);
  const qiContract = new ethers.Contract(qiAddress, QI_IFACE, provider);

  switch (agentConfig.thresholdMode) {
    case ThresholdMode.ABSOLUTE:
      return async (value: BigNumber, _: number): Promise<boolean> => {
        return value.gte(bnThreshold);
      };
    case ThresholdMode.PERCENTAGE_TOTAL_SUPPLY:
      return async (value: BigNumber, block: number): Promise<boolean> => {
        const totalSupply = await qiContract.totalSupply({
          blockTag: block,
        });
        return value.gte(totalSupply.mul(bnThreshold).div(100));
      };
    case ThresholdMode.PERCENTAGE_COMP_BALANCE:
      return async (value: BigNumber, block: number): Promise<boolean> => {
        const compBalance = await qiContract.balanceOf(comptrollerAddress, {
          blockTag: block - 1,
        });
        return value.gte(compBalance.mul(bnThreshold).div(100));
      };
  }
};

export const provideHandleTransaction = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig,
  provider?: any
): HandleTransaction => {
  const isLarge = provideIsLarge(qiAddress, comptrollerAddress, agentConfig, provider);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const events = txEvent.filterLog(QI_GRANTED_ABI, comptrollerAddress);

    await Promise.all(
      events.map(async (log: LogDescription) => {
        if (await isLarge(log.args.amount, txEvent.blockNumber)) {
          findings.push(
            createFinding(log.args.recipient, log.args.amount, agentConfig.thresholdMode, agentConfig.threshold)
          );
        }
      })
    );

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(QI_ADDRESS, COMPTROLLER_ADDRESS, CONFIG, getEthersProvider()),
};
