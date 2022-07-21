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

// Uncomment this line for the mainnet test:
// CONFIG[Network.MAINNET].tvlPercentageThreshold = "0";

// Uncomment this line for the testnet test:
// CONFIG[5] = { vaultAddress: "0x1398ddbc64f9e8a844da6c025a3a46c47e22f376", tvlPercentageThreshold: "50" };

export default CONFIG;
