import { AgentConfig, Network } from "./utils";

const CONFIG: AgentConfig = {
  [Network.ETHEREUM_MAINNET]: {
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

export default CONFIG;
