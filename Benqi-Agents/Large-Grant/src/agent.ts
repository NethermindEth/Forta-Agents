import { BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { JsonRpcProvider } from "@ethersproject/providers/lib/json-rpc-provider";
import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
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

const provideIsLarge = (agentConfig: AgentConfig): ((value: BigNumber) => boolean) => {
  const bnThreshold = BigNumber.from(agentConfig.threshold);

  switch (agentConfig.thresholdMode) {
    case ThresholdMode.ABSOLUTE:
      return (value: BigNumber): boolean => {
        return value.gte(bnThreshold);
      };
    case ThresholdMode.PERCENTAGE_TOTAL_SUPPLY:
      return (value: BigNumber): boolean => {
        const totalSupply = BigNumber.from(QI_TOTAL_SUPPLY);
        return value.gte(totalSupply.mul(bnThreshold).div(100));
      };
    case ThresholdMode.PERCENTAGE_COMP_BALANCE:
      return (value: BigNumber): boolean => {
        return value.gte(comptrollerBalance.mul(bnThreshold).div(100));
      };
  }
};

const provideSetupComptrollerBalance = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig,
  provider?: JsonRpcProvider
): ((block: number) => Promise<void>) => {
  comptrollerBalance = BigNumber.from(-1);

  if (agentConfig.thresholdMode !== ThresholdMode.PERCENTAGE_COMP_BALANCE) {
    return async (_: number) => {};
  } else {
    return async (block: number) => {
      // by initializing comptrollerBalance here the agent doesn't need that
      // the block initialize() would be called would be right before the one
      // handleTransaction is first called
      if (comptrollerBalance.eq(-1)) {
        const qiContract = new Contract(qiAddress, QI_IFACE, provider);
        comptrollerBalance = await qiContract.balanceOf(comptrollerAddress, {
          blockTag: block - 1,
        });
      }
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

export const provideHandleTransaction = (
  qiAddress: string,
  comptrollerAddress: string,
  agentConfig: AgentConfig,
  provider?: JsonRpcProvider
): HandleTransaction => {
  const isLarge = provideIsLarge(agentConfig);
  const updateComptrollerBalance = provideUpdateComptrollerBalance(qiAddress, comptrollerAddress, agentConfig);
  const setupComptrollerBalance = provideSetupComptrollerBalance(qiAddress, comptrollerAddress, agentConfig, provider);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    await setupComptrollerBalance(txEvent.blockNumber);

    const events = txEvent.filterLog(QI_GRANTED_ABI, comptrollerAddress);

    await Promise.all(
      events.map(async (log: LogDescription) => {
        if (isLarge(log.args.amount)) {
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
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(QI_ADDRESS, COMPTROLLER_ADDRESS, CONFIG, getEthersProvider()),
};
