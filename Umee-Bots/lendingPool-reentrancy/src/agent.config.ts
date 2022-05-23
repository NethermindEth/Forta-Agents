import utils, { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  reentrancyFunctionsSelectors: utils.REENTRANCY_FUNCTIONS_SELECTORS,
  // Address of the LendingPool contract
  lendingPoolAddress: "0xce744a9baf573167b2cf138114ba32ed7de274fa",
};

// Uncomment these lines for the testnet test:
//CONFIG.lendingPoolAddress = "0x3526a2fe5da32d0f0814086848628bf12a1e4417";

export default CONFIG;
