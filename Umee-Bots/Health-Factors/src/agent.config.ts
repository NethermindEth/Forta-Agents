import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Debt value threshold in USD below which the position monitoring will be dropped
  ignoreThreshold: "20",

  // Health factor threshold below which an alert can be emitted
  healthFactorThreshold: "1.05",

  // Collateral value threshold in USD above which an alert can be emitted
  upperThreshold: "2000000",

  // Chainlink feed for the ETH-USD pair
  ethUsdFeedAddress: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",

  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

// Uncomment these lines for the mainnet test:

// CONFIG.ignoreThreshold = "0";
// CONFIG.healthFactorThreshold = "10000000";
// CONFIG.upperThreshold = "0";

// Uncomment these lines for the testnet test:

// CONFIG.ignoreThreshold = "20";
// CONFIG.healthFactorThreshold = "1.05";
// CONFIG.upperThreshold = "2000000";
// CONFIG.ethUsdFeedAddress = "0xb353f73709F0DC15Fb9AD9Fb96658a4EBe8aE3BA";
// CONFIG.lendingPoolAddress = "0xc1c7352b164498c000Fac3990e0687cC5369646c";

export default CONFIG;
