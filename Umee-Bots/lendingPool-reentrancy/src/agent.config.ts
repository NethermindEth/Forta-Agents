import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  reentrancyBlacklist: [
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
  ],
  // Address of the LendingPool contract
  lendingPoolAddress: "0xce744a9baf573167b2cf138114ba32ed7de274fa",
};

// Uncomment these lines for the testnet test:
// CONFIG.lendingPoolAddress = "0x094e1340a1d0f8db9bbba9c0ce541a22acda15ef";

export default CONFIG;
