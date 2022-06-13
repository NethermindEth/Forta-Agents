import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // Threshold of usage ratio value (optional) - related to alert UMEE-7-1
  absoluteThreshold: "0.9",

  // Threshold of usage ratio increase based on the previous block (optional) - related to alert UMEE-7-2
  percentageThreshold: "100",

  // Cooldown between alerts for each reserve (in seconds)
  alertCooldown: {
    // Related to absolute threshold alerts (UMEE-7-1)
    absolute: 600,

    // Related to percentage threshold alerts (UMEE-7-2)
    percentage: 0,
  },

  // Address of the LendingPool contract
  lendingPoolAddress: "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",

  // Address of the LendingPoolConfigurator contract
  lendingPoolConfiguratorAddress: "0xe296db0a0e9A225202717e9812bF29CA4f333bA6",
};

// Uncomment these lines for the mainnet test:

// CONFIG.absoluteThreshold = "0";
// CONFIG.percentageThreshold = "0";
// CONFIG.alertCooldown = { absolute: 30, percentage: 0 };

// Uncomment these lines for the testnet test:

// CONFIG.absoluteThreshold = "0.9";
// CONFIG.percentageThreshold = "10";
// CONFIG.alertCooldown = { absolute: 45, percentage: 0 };
// CONFIG.lendingPoolAddress = "0xa60d64265E6545B1803FE36c7D014f6d06A6f6Ac";

export default CONFIG;
