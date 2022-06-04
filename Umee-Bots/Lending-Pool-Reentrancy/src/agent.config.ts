import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Signatures that will result in a finding emission if called in a reentrant manner
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

// Uncomment rhis lines for the testnet test:
// CONFIG.lendingPoolAddress = "0x9109c02d40ba02ccc6ed3436404ab2bc7bb707f7";

export default CONFIG;
