import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Threshold of usage ratio value (optional)
  absoluteThreshold: "0.9",

  // Threshold of usage ratio increase based on the previous block (optional)
  percentageThreshold: "100",

  // Cooldown between alerts for each reserve (in seconds)
  alertCooldown: 600,

  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",

  // Address of the LendingPoolConfigurator contract
  lendingPoolConfiguratorAddress: "0xe296db0a0e9A225202717e9812bF29CA4f333bA6",
};

export default CONFIG;
