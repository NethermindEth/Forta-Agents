import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { ethers, BigNumber } from "ethers";

export const EVENT_ABI = ["event Transfer(address indexed from, address indexed to, uint256 amount)"];
export const BALANCE_ABI = ["function balanceOf(address account) external view returns (uint)"];
export const benqiInterface = new ethers.utils.Interface(BALANCE_ABI);

const isTestnet: boolean = false;

export const QI_TOKEN_CONTRACT = isTestnet
  ? "0x749590F04a3aa91B53E03124FDa4Ec0391D4Dd4E" // AVAX Testnet QI Token Contract address
  : "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5"; // AVAX Mainnet QI Token Contract address

const QI_DECIMALS: number = 18;
const TOTAL_SUPPLY: BigNumber = BigNumber.from("7200000000").mul(`${10 ** QI_DECIMALS}`);
const THRESHOLD_BALANCE_PERCENTAGE: number = 5;
const THRESHOLD_TRANSFER_AMOUNT: number = 1000000;
export const TRANSFERRED_TOKEN_THRESHOLD: BigNumber = BigNumber.from(THRESHOLD_TRANSFER_AMOUNT).mul(
  `${10 ** QI_DECIMALS}`
);
export const BALANCE_THRESHOLD: BigNumber = TOTAL_SUPPLY.mul(THRESHOLD_BALANCE_PERCENTAGE).div(100);

export const createTransferFinding = (log: LogDescription) => {
  return Finding.fromObject({
    name: "QI Token Transfer",
    description: "Large amount of QI token transfer is detected",
    alertId: "BENQI-3-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      from: log.args.from,
      to: log.args.to,
      amount: log.args.amount.toString(),
    },
  });
};

export const createLargeBalanceFinding = (account: string, balance: BigNumber) => {
  return Finding.fromObject({
    name: "Large Amount of QI Balance",
    description: "An account with large amount of balance is detected",
    alertId: "BENQI-3-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      account,
      balance: balance.toString(),
    },
  });
};
