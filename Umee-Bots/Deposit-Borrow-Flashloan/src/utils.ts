import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const LENDING_POOL = "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa";
// for Kovan network test case, comment out the LENDING_POOL address above and uncomment the LENDING_POOL address below.
// export const LENDING_POOL = "0xa4278adb8f23Ed4B859a92c2C5926338A1F46a9e";

export const DEPOSIT_ABI =
  "event Deposit(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)";

export const BORROW_ABI =
  "event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 indexed referral)";

export const FLASHLOAN_ABI =
  "event FlashLoan(address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint256 premium, uint16 referralCode)";

export const RESERVE_ABI =
  "event ReserveDataUpdated( address indexed reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)";

export function createFinding(logName: string, from: string, to: string | null): Finding {
  const alertId = logName == "Deposit" ? "UMEE-14-1" : "UMEE-14-2";

  return Finding.from({
    name: `FlashLoan with ${logName}`,
    description: `A ${logName} along with a FlashLoan have occured in the lending pool contract`,
    alertId,
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Umee",
    metadata: {
      realizedEvents: `FlashLoan - ${logName}`,
      from,
      to: to ? to : "null",
    },
  });
}
