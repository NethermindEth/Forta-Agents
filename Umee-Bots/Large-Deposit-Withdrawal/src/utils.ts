import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export interface AgentConfig {
  threshold: string;
  ethUsdFeedAddress: string;
  lendingPoolAddress: string;
  umeeOracleAddress: string;
}
export function createFinding(log: LogDescription, valueInUsd: string): Finding {
  const alertId: string = log.name == "Deposit" ? "UMEE-8-1" : "UMEE-8-2";
  const reserve: string = log.args.reserve;
  const user: string = log.args.user;

  return Finding.from({
    alertId,
    name: `Large ${log.name}`,
    description: `A large ${log.name} has occured in the lending pool contract`,
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Umee",
    metadata: {
      user,
      reserve,
      valueInUsd,
    },
  });
}

export function createWithdrawalFinding(address: string): Finding {
  return Finding.from({
    alertId: "UMEE-8",
    name: "Large withdrawal",
    description: "A large withdrawal has occured in the lending pool contract",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Umee",
    metadata: {
      address,
    },
  });
}

export function ethersBnToBn(value: ethers.BigNumber, decimals: number): BigNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals);
}
