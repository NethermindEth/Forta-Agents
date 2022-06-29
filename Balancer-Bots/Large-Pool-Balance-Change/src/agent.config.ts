import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Address of the Vault contract
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    // Minimum percentage token amount relative to the Vault's token balance
    threshold: "40",
  },

  [Network.POLYGON]: {
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    threshold: "40",
  },

  [Network.ARBITRUM]: {
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    threshold: "40",
  },
};

// Uncomment these lines for the Kovan testnet test:
// CONFIG[42] = {
//   vaultAddress: "0x87B105c9DC29C79f9cb53AbCAC0967E0674Ee2BB",
//   threshold: "25",
// };

// Uncomment these lines for the mainnet, Polygon or Arbitrum tests:
// CONFIG[Network.MAINNET].threshold = "15";
// CONFIG[Network.POLYGON].threshold = "15";
// CONFIG[Network.ARBITRUM].threshold = "0";

export default CONFIG;
