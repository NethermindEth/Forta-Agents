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

export default CONFIG;
