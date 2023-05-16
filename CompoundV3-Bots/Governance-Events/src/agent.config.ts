import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    cometAddresses: ["0xc3d688B66703497DAA19211EEdff47f25384cdc3", "0xA17581A9E3356d9A858b789D68B4d866e593aE94"],
  },

  [Network.POLYGON]: {
    cometAddresses: ["0xF25212E676D1F7F89Cd72fFEe66158f541246445"],
  },

  // Sepolia
  11155111: {
    cometAddresses: ["0x8b3fd6dd96da931f1d2ffe3b4660690b5e2420c6"],
  },
};

export default CONFIG;
