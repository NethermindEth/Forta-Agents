import { Finding, FindingSeverity, FindingType, ethers } from "forta-agent";
import { Interface } from "ethers/lib/utils";
import BigNumber from "bignumber.js";

export interface AgentConfig {
  uTokens: Array<{ uToken: string; address: string }>;
  uTokenPairs: Array<{ uToken1: string; uToken2: string; threshold: number; difference: number }>;
  umeeOracle: string;
  lendingPool: string;
}

export const UTOKENS_IFACE = new Interface(["function UNDERLYING_ASSET_ADDRESS() public view returns (address)"]);

export const UMEE_ORACLE_PRICE_IFACE = new Interface([
  "function getAssetPrice(address asset) external view returns (uint256)",
]);

export const LENDING_POOL_IFACE = new Interface([
  "function getReserveNormalizedIncome(address asset) public view returns (uint256)",
]);

export function createFinding(
  pair: string,
  previousRatio: BigNumber,
  currentRatio: BigNumber,
  severity: FindingSeverity
): Finding {
  return Finding.from({
    alertId: "UMEE-2",
    name: "uToken exchange ratio drop",
    description: `uToken pair of ${pair} has dropped.`,
    type: FindingType.Info,
    severity,
    protocol: "Umee",
    metadata: {
      pair,
      previousRatio: previousRatio.toString(10),
      currentRatio: currentRatio.toString(10),
    },
  });
}

// export const calculatePriceRatio = (numeratorPrice: BigNumber, denominatorPrice: BigNumber) => {
//   return (
//     Number(
//       numeratorPrice
//         .mul(`${10 ** CONFIG.decimals}`)
//         .div(denominatorPrice)
//         .toString()
//     ) /
//     10 ** CONFIG.decimals
//   );
// };

export const calculatePriceRatio = (
  numeratorPrice: ethers.BigNumber,
  denominatorPrice: ethers.BigNumber
): BigNumber => {
  return new BigNumber(numeratorPrice.toString()).div(denominatorPrice.toString());
};

export const calculateSeverity = (ratioDifference: BigNumber, pairThreshold: number, thresholdDifference: number) => {
  let severity;

  switch (ratioDifference.minus(pairThreshold).div(thresholdDifference).integerValue(BigNumber.ROUND_CEIL).toNumber()) {
    case 1:
      severity = FindingSeverity.Info;
      break;
    case 2:
      severity = FindingSeverity.Low;
      break;
    case 3:
      severity = FindingSeverity.Medium;
      break;
    case 4:
      severity = FindingSeverity.High;
      break;
    default:
      severity = FindingSeverity.Critical;
      break;
  }

  return severity;
};

export function ethersBnToBn(value: ethers.BigNumber, decimals: number): BigNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals);
}
