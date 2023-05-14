import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    cometAddresses: [
      "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
      "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
    ],
    alertFrequency: 7200, // every 2 hours
  },

  [Network.POLYGON]: {
    cometAddresses: ["0xF25212E676D1F7F89Cd72fFEe66158f541246445"],
    alertFrequency: 7200, // every 2 hours
  },

  // Sepolia
  11155111: {
    cometAddresses: ["0x61fFE3A3147386137C8CB9fCAF708687619cEBd3"],
    alertFrequency: 7200,
  },
};

export default CONFIG;
