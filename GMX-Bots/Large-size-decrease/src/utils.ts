import BigNumber from "bignumber.js";
import { Finding, FindingSeverity, FindingType, LogDescription, ethers } from "forta-agent";

const DECREASE_POSITION_EVENT =
  " event DecreasePosition(bytes32 key, address account, address collateralToken, address indexToken,uint256 collateralDelta,uint256 sizeDelta,bool isLong,uint256 price,uint256 fee)";
const CLOSE_POSITION_EVENT =
  " event ClosePosition(bytes32 key, uint256 size, uint256 collateral,uint256 averagePrice,uint256 entryFundingRate,uint256 reserveAmount,int256 realisedPnl)";
const PRICE_PRECISION = 10 ** 30;

function isPositionClosed(allCloseEvents: LogDescription[], decreasePositionArgs: ethers.utils.Result): boolean {
  let args: ethers.utils.Result;
  for ({ args } of allCloseEvents) {
    if (
      ethers.BigNumber.from(args.key).eq(decreasePositionArgs.key) &&
      ethers.BigNumber.from(args.size).eq(decreasePositionArgs.sizeDelta)
    )
      return true;
  }
  return false;
}

const createFinding = (
  sizeDelta: BigNumber,
  key: string,
  account: string,
  isClosed: boolean,
  contractAddress: string
): Finding =>
  isClosed
    ? Finding.fromObject({
        name: "Large size Position closed",
        description: "ClosePosition Event with large size emitted from GMX's Vault contract",
        alertId: "GMX-2-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "GMX",
        metadata: {
          GMX: contractAddress,
          Account: account,
          "Position size": sizeDelta.toFixed(2),
          "Position key": key,
        },
      })
    : Finding.fromObject({
        name: "Large size decrease in Position",
        description: "DecreasePosition Event with large sizeDelta emitted from GMX's Vault contract",
        alertId: "GMX-2-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "GMX",
        metadata: {
          GMX: contractAddress,
          Account: account,
          "Position decrease": sizeDelta.toFixed(2),
          "Position key": key,
        },
      });

export { DECREASE_POSITION_EVENT, CLOSE_POSITION_EVENT, PRICE_PRECISION, isPositionClosed, createFinding };
