import { BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { JsonRpcProvider } from "@ethersproject/providers/lib/json-rpc-provider";
import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { createFinding } from "./finding";
import { AgentConfig, QI_BALANCE_ABI, QI_GRANTED_ABI, QI_TOTAL_SUPPLY, ThresholdMode } from "./utils";

const QI_IFACE = new Interface([QI_BALANCE_ABI]);

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
        return value.mul(100).gte(totalSupply.mul(bnThreshold));
      };
    case ThresholdMode.PERCENTAGE_COMPTROLLER_BALANCE:
      return (value: BigNumber): boolean => {
        return value.mul(100).gte(comptrollerBalance.mul(bnThreshold));
      };
  }
};

const provideUpdateComptrollerBalance = (
  agentConfig: AgentConfig,
  provider?: JsonRpcProvider
): ((block: number) => Promise<void>) => {
  let balanceBlock = -1;

  if (agentConfig.thresholdMode !== ThresholdMode.PERCENTAGE_COMPTROLLER_BALANCE) {
    return async () => {};
  } else {
    return async (block: number) => {
      if (block !== balanceBlock) {
        balanceBlock = block;

        const qiContract = new Contract(agentConfig.qiAddress, QI_IFACE, provider);
        comptrollerBalance = await qiContract.balanceOf(agentConfig.comptrollerAddress, {
          blockTag: block - 1,
        });
      }
    };
  }
};

export const provideHandleTransaction = (agentConfig: AgentConfig, provider?: JsonRpcProvider): HandleTransaction => {
  const isLarge = provideIsLarge(agentConfig);
  const updateComptrollerBalance = provideUpdateComptrollerBalance(agentConfig, provider);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const events = txEvent.filterLog(QI_GRANTED_ABI, agentConfig.comptrollerAddress);

    if (events.length) {
      await updateComptrollerBalance(txEvent.blockNumber);
    }

    await Promise.all(
      events.map(async (log: LogDescription) => {
        if (isLarge(log.args.amount)) {
          findings.push(createFinding(log.args.recipient, log.args.amount));
        }
      })
    );

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider()),
};
