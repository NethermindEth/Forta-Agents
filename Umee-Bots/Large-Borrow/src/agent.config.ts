import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Borrow amount above which an alert will be emitted (% of TVL)
  tvlPercentageThreshold: "50.5",

  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

// Uncomment these lines for the mainnet test:

// CONFIG.tvlPercentageThreshold = "0";
// CONFIG.lendingPoolAddress = "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa";

// Uncomment these lines for the testnet test:

// CONFIG.tvlPercentageThreshold = "50.5";
// CONFIG.lendingPoolAddress = "0x6A28b9bafE44c2c5003Be84638e6317BDaB95251";

export default CONFIG;
