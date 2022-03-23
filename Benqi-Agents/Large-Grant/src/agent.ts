import { BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  Initialize,
  LogDescription,
  TransactionEvent,
} from "forta-agent";
import CONFIG from "./agent.config";
import { createFinding } from "./finding";
import {
  AgentConfig,
  COMPTROLLER_ADDRESS,
  QI_ADDRESS,
  QI_BALANCE_ABI,
  QI_GRANTED_ABI,
  QI_TOTAL_SUPPLY,
  QI_TOTAL_SUPPLY_ABI,
  QI_TRANSFER_ABI,
  ThresholdMode,
} from "./utils";

const QI_IFACE = new Interface([QI_TOTAL_SUPPLY_ABI, QI_BALANCE_ABI]);

let comptrollerBalance = BigNumber.from(-1);

const provideIsLarge = (agentConfig: AgentConfig): ((value: BigNumber) => Promise<boolean>) => {
  const bnThreshold = BigNumber.from(agentConfig.threshold);

  switch (agentConfig.thresholdMode) {
    case ThresholdMode.ABSOLUTE:
      return async (value: BigNumber): Promise<boolean> => {
        return value.gte(bnThreshold);
      };
    case ThresholdMode.PERCENTAGE_TOTAL_SUPPLY:
      return async (value: BigNumber): Promise<boolean> => {
        const totalSupply = BigNumber.from(QI_TOTAL_SUPPLY);
        return value.gte(totalSupply.mul(bnThreshold).div(100));
      };
    case ThresholdMode.PERCENTAGE_COMP_BALANCE:
      return async (value: BigNumber): Promise<boolean> => {
        return value.gte(comptrollerBalance.mul(bnThreshold).div(100));
      };
  }
};

const provideUpdateComptrollerBalance = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig
): ((txEvent: TransactionEvent) => void) => {
  if (agentConfig.thresholdMode !== ThresholdMode.PERCENTAGE_COMP_BALANCE) {
    return () => {};
  } else {
    return (txEvent: TransactionEvent) => {
      txEvent.filterLog(QI_TRANSFER_ABI, qiAddress).forEach((log) => {
        if (log.args.from !== comptrollerAddress && log.args.to === comptrollerAddress) {
          comptrollerBalance = comptrollerBalance.add(log.args.amount);
        } else if (log.args.from === comptrollerAddress && log.args.to !== comptrollerAddress) {
          comptrollerBalance = comptrollerBalance.sub(log.args.amount);
        }
      });
    };
  }
};

const provideInitialize = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig,
  provider?: any
): Initialize => {
  if (agentConfig.thresholdMode !== ThresholdMode.PERCENTAGE_COMP_BALANCE) {
    return async () => {};
  } else {
    const qiContract = new Contract(qiAddress, QI_IFACE, provider);
    return async (): Promise<void> => {
      comptrollerBalance = await qiContract.balanceOf(comptrollerAddress);
    };
  }
};

export const provideHandleTransaction = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig
): HandleTransaction => {
  const isLarge = provideIsLarge(agentConfig);
  const updateComptrollerBalance = provideUpdateComptrollerBalance(qiAddress, comptrollerAddress, agentConfig);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const events = txEvent.filterLog(QI_GRANTED_ABI, comptrollerAddress);

    await Promise.all(
      events.map(async (log: LogDescription) => {
        if (await isLarge(log.args.amount)) {
          findings.push(
            createFinding(log.args.recipient, log.args.amount, agentConfig.thresholdMode, agentConfig.threshold)
          );
        }
      })
    );

    updateComptrollerBalance(txEvent);

    return findings;
  };
};

export default {
  provideInitialize,
  initialize: provideInitialize(QI_ADDRESS, COMPTROLLER_ADDRESS, CONFIG, getEthersProvider()),
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(QI_ADDRESS, COMPTROLLER_ADDRESS, CONFIG),
};
