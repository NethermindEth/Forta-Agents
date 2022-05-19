import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  ignoreThreshold: "20", // USD
  healthFactorThreshold: "1.05",
  upperThreshold: "2000000", // USD
  ethUsdFeedAddress: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
};

export default CONFIG;
