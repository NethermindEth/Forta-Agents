import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Address of the Vault contract
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    // Minimum swapped token amount relative to the Vault TVL percentage that leads to a finding emission (in %)
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

// Uncomment these lines for the mainnet test:
// CONFIG[Network.MAINNET].tvlPercentageThreshold = "0";

// Uncomment these lines for the testnet test:
// CONFIG[42] = { vaultAddress: "0xC965F77387C6035B41aa08fBb7A4F997F05a1A15", tvlPercentageThreshold: "50" };

export default CONFIG;
