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

// Uncomment this line for the Kovan testnet test:
// CONFIG[42] = { vaultAddress: "0x0587519e520ED78c5Ae17a605932955956BE1438", threshold: "5" };

// Uncomment these lines for the mainnet, Polygon or Arbitrum tests:
// CONFIG[Network.MAINNET].threshold = "0";
// CONFIG[Network.POLYGON].threshold = "0";
// CONFIG[Network.ARBITRUM].threshold = "0";

export default CONFIG;
