import BigNumber from "bignumber.js";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

const CLOSE_POSITION_EVENT =
  " event ClosePosition(bytes32 key, uint256 size, uint256 collateral,uint256 averagePrice,uint256 entryFundingRate,uint256 reserveAmount,int256 realisedPnl)";
const PRICE_PRECISION = 10 ** 30;
const UNUSUAL_LIMIT = 33000;
const HIGH_PNLTOSIZE = 1.1; //percent

const createFinding = (positionSize: BigNumber, realisedPnl: BigNumber, key: string, contract: string): Finding =>
  Finding.fromObject({
    name: "Unusual PnL",
    description: "ClosePosition Event with a high pnl emitted from GMX's Vault contract",
    alertId: "GMX-6",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "GMX",
    metadata: {
      "Realised PnL": realisedPnl.toFixed(2),
      "Position size": positionSize.toFixed(2),
      GMX: contract,
      "Position key": key,
    },
  });

export { CLOSE_POSITION_EVENT, UNUSUAL_LIMIT, createFinding, HIGH_PNLTOSIZE, PRICE_PRECISION };
