import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Address of BAL token contract
    balToken: "0xba100000625a3754423978a60c9317c58a424e3d",
    // Minimum percentage token transfer amount relative to BAL total supply in that network that leads to a finding
    // (in %)
    threshold: "5",
  },

  [Network.POLYGON]: {
    balToken: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
    threshold: "5",
  },

  [Network.ARBITRUM]: {
    balToken: "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8",
    threshold: "5",
  },
};

// Uncomment these lines for the Kovan testnet test:
// CONFIG[42] = {
//   balToken: "0xdba73aCEa7BC780f4c3f565732c10fDcAC5b28D6",
//   threshold: "10",
// };

// Uncomment these lines for the mainnet, Polygon or Arbitrum tests:
// CONFIG[Network.MAINNET].threshold = "0";
// CONFIG[Network.POLYGON].threshold = "0";
// CONFIG[Network.ARBITRUM].threshold = "0";

export default CONFIG;
