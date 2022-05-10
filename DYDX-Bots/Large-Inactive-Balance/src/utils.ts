import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const EVENT_SIGNATURE = ["event WithdrawalRequested(address indexed staker, uint256 stakeAmount)"];

// functions needed by the fetchers.
export const INACTIVE_BALANCE_ABI = new Interface([
  "function getInactiveBalanceNextEpoch(address staker) public view returns (uint256)",
]);
export const BALANCE_ABI = new Interface(["function balanceOf(address user) public view returns (uint256)"]);

// function to generate findings
export const createFinding = (mode: string, staker: string, inactiveBalance: BigNumber): Finding => {
  return Finding.fromObject({
    name: "Large inactive balance on Safety module",
    description: "Staker with large inactive balance on safety module is detected",
    alertId: "DYDX-13",
    protocol: "dYdX",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      mode: mode,
      staker: staker.toLowerCase(),
      inactiveBalance: inactiveBalance.toString(),
    },
  });
};
