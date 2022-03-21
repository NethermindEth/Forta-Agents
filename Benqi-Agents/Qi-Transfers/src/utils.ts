import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { ethers, BigNumber } from "ethers";

export const QI_TOKEN_CONTRACT = "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5"; //Benqi token(qi) contract
export const EVENT_ABI = ["event Transfer(address indexed from, address indexed to, uint256 amount)"];
export const BALANCE_ABI = ["function balanceOf(address account) external view returns (uint)"];
export const benqiInterface = new ethers.utils.Interface(BALANCE_ABI);

const TOTAL_SUPPLY = BigNumber.from("7200000000000000000000000000");
const PERCENTAGE = 5;
export const TRANSFERED_TOKEN_THRESHOLD = BigNumber.from("1000000000000000000000000");
export const BALANCE_THRESHOLD = TOTAL_SUPPLY.mul(PERCENTAGE).div(100);

export const createTransferFinding = (log: LogDescription) => {
  return Finding.fromObject({
    name: "QI Token Transfer",
    description: "Large amount of QI token transfer is detected",
    alertId: "BENQI-3-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi",
    metadata: {
      from: log.args.from,
      to: log.args.to,
      amount: BigNumber.from(log.args.amount).toString(),
    },
  });
};

export const createLargeBalanceFinding = (account: string, balance: BigNumber) => {
  return Finding.fromObject({
    name: "Large Amount of QI Balance",
    description: "A user with large amount of QI token is detected",
    alertId: "BENQI-3-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi",
    metadata: {
      account,
      balance: balance.toString(),
    },
  });
};
