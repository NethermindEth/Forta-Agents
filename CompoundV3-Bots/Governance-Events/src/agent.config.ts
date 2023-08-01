import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    cometContracts: [
      {
        address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        timelockGovernorAddress: "0x6d903f6003cca6255D85CcA4D3B5E5146dC33925",
      },
      {
        address: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
        timelockGovernorAddress: "0x6d903f6003cca6255D85CcA4D3B5E5146dC33925",
      },
    ],
  },

  [Network.POLYGON]: {
    cometContracts: [
      {
        address: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
        timelockGovernorAddress: "0xcc3e7c85bb0ee4f09380e041fee95a0caedd4a02",
      },
    ],
  },

  // Sepolia
  11155111: {
    cometContracts: [
      {
        address: "0x8b3fd6dd96da931f1d2ffe3b4660690b5e2420c6",
        timelockGovernorAddress: "0x8b3fd6dd96da931f1d2ffe3b4660690b5e2420c6",
      },
    ],
  },
};

export default CONFIG;