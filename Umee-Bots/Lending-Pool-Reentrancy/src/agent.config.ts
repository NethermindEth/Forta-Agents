import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Functions that will result in a finding emission if called in a reentrant manner
  // Add "(call)" to account for simple calls and "(unknown)" to account for any call whose
  // selector isn't included in the LendingPool ABI specification.
  reentrancyBlacklist: [
    "borrow",
    "withdraw",
    "flashLoan",
    "deposit",
    "repay",
    "swapBorrowRateMode",
    "rebalanceStableBorrowRate",
    "setUserUseReserveAsCollateral",
    "liquidationCall",
    "finalizeTransfer",
  ],
  // Address of the LendingPool contract
  lendingPoolAddress: "0xce744a9baf573167b2cf138114ba32ed7de274fa",
};

// Uncomment this line for the testnet test:
// CONFIG.lendingPoolAddress = "0x9109c02d40ba02ccc6ed3436404ab2bc7bb707f7";

export default CONFIG;
