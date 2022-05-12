import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { ethers, BigNumber } from "ethers";
export const EVENT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
export const BALANCE_OF_ABI = [
  "function balanceOf(address account) public view  returns (uint256)",
];
export const APESWAP_INTERFACE = new ethers.utils.Interface(BALANCE_OF_ABI);
export const GNANA_TOKEN_CONTRACT =
  "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299";
export const GNANA_DECIMALS: number = 18;
export const THRESHOLD_BALANCE_PERCENTAGE: number = 1;
const TOTAL_SUPPLY: BigNumber = BigNumber.from("3000000000").mul(
  `${10 ** GNANA_DECIMALS}`
);
export const BALANCE_THRESHOLD: BigNumber = TOTAL_SUPPLY.mul(
  THRESHOLD_BALANCE_PERCENTAGE
).div(100);
export const createLargeBalanceFinding = (
  account: string,
  balance: BigNumber
) => {
  return Finding.fromObject({
    name: "Large Amount of GNANA Balance",
    description: "An account with large amount of balance is detected",
    alertId: "APESWAP-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap Finance",
    metadata: {
      account,
      balance: balance.toString(),
    },
  });
};
