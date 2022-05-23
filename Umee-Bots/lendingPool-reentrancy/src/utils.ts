import { Interface } from "@ethersproject/abi";

import { Finding, FindingSeverity, FindingType } from "forta-agent";

const LENDING_POOL_ADDRESS = "0x3526a2fe5da32d0f0814086848628bf12a1e4417";

const REENTRANCY_FUNCTIONS_SIGNATURES: string[] = [
  "borrow(address,uint256,uint256,uint16,address)",
  "withdraw(address,uint256,address)",
  "flashLoan(address,address[],uint256[],uint256[],address,bytes,uint16)",
  "deposit(address,uint256,address,uint16)",
  "repay(address,uint256,uint256,address)",
  "swapBorrowRateMode(address,uint256)",
  "rebalanceStableBorrowRate(address,address)",
  "setUserUseReserveAsCollateral(address, bool)",
  "liquidationCall(address,address,address,uint256,bool)",
  "finalizeTransfer(address,address,address,uint256,uint256,uint256)",
];
const REENTRANCY_FUNCTIONS_ABI: string[] = [
  "function deposit(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)",
  "function borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)",
  "function repay(address asset,uint256 amount,uint256 rateMode,address onBehalfOf)",
  "function swapBorrowRateMode(address asset, uint256 rateMode)",
  "function rebalanceStableBorrowRate(address asset, address user)",
  "function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)",
  "function withdraw(address asset,uint256 amount,address to)",
  "function liquidationCall(address collateralAsset,address debtAsset,address user,uint256 debtToCover,bool receiveUToken)",
  "function flashLoan(address receiverAddress,address[] calldata assets,uint256[] calldata amounts,uint256[] calldata modes,address onBehalfOf,bytes calldata params,uint16 referralCode)",
  "function finalizeTransfer(address asset,address from,address to,uint256 amount,uint256 balanceFromBefore,uint256 balanceToBefore)",
];

const FUNCTIONS_INTERFACE = new Interface(REENTRANCY_FUNCTIONS_ABI);

const REENTRANCY_FUNCTIONS_SELECTORS = Object.values(FUNCTIONS_INTERFACE.functions).map((el) =>
  FUNCTIONS_INTERFACE.getSighash(el)
);

const createFinding = (initialCallSelector: string, lendingPoolCallSelector: string): Finding => {
  return Finding.fromObject({
    name: "Detect Lending Pool Reentrancy",
    description: "Detect when a reentrancy happened in the LendingPool contract",
    alertId: "UMEE-9",
    type: FindingType.Exploit,
    severity: FindingSeverity.High,
    metadata: {
      initialCallSelector,
      lendingPoolCallSelector,
    },
  });
};

export default {
  LENDING_POOL_ADDRESS,
  FUNCTIONS_INTERFACE,
  REENTRANCY_FUNCTIONS_SIGNATURES,
  REENTRANCY_FUNCTIONS_SELECTORS,
  createFinding,
};
