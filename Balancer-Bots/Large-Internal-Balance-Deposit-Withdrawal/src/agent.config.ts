import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Address of the Vault contract
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    // Minimum percentage token amount relative to the Vault's token balance
    threshold: "5",
  },

  [Network.POLYGON]: {
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    threshold: "5",
  },

  [Network.ARBITRUM]: {
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    threshold: "5",
  },
};

// this line is for the Kovan testnet test:
CONFIG[42] = { vaultAddress: "0x9e324ef913f35e3d0f6fc35c32ce4ee3bb27423e", threshold: "5" };

// Uncomment these lines for the mainnet, Polygon or Arbitrum tests:
// CONFIG[Network.MAINNET].threshold = "0";
// CONFIG[Network.POLYGON].threshold = "0";
// CONFIG[Network.ARBITRUM].threshold = "0";

export default CONFIG;
