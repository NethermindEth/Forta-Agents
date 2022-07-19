import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Address of the Vault contract
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    // Minimum percentage of the Vault balance that, when borrowed, leads to a finding
    tvlPercentageThreshold: "50.5",
  },

  [Network.POLYGON]: {
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    tvlPercentageThreshold: "50.5",
  },

  [Network.ARBITRUM]: {
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    tvlPercentageThreshold: "50.5",
  },
};

// Uncomment this line for the mainnet test:
// CONFIG[Network.MAINNET].tvlPercentageThreshold = "2.5";

// Uncomment this line for the polygon test:
// CONFIG[Network.POLYGON].tvlPercentageThreshold = "0.1";

// Uncomment these lines for the arbitrum test:
// CONFIG[Network.ARBITRUM].tvlPercentageThreshold = "0.015";

// Uncomment these lines for the testnet test:
// CONFIG[42] = { vaultAddress: "0xce8e87f63132c573268fc58FC9a249178bb7a97f", tvlPercentageThreshold: "50.5" };

export default CONFIG;
