import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    cometContracts: [
      {
        address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        baseToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
      {
        address: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
        baseToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      },
    ],
  },

  [Network.POLYGON]: {
    cometContracts: [
      {
        address: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
        baseToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      },
    ],
  },
};

export default CONFIG;
