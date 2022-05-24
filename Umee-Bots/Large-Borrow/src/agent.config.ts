import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Borrow amount above which an alert will be emitted (% of TVL)
  tvlPercentageThreshold: "50.5",

  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

export default CONFIG;
