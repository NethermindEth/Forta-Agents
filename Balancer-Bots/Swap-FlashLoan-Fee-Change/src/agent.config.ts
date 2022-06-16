import { AgentConfig, Network } from "./utils";

const CONFIG: AgentConfig = {
  [Network.ETHEREUM_MAINNET]: {
    // Address of the ProtocolFeesCollector contract
    protocolFeesCollectorAddress: "0xce88686553686da562ce7cea497ce749da109f9f",
  },

  [Network.POLYGON]: {
    protocolFeesCollectorAddress: "0xce88686553686da562ce7cea497ce749da109f9f",
  },

  [Network.ARBITRUM]: {
    protocolFeesCollectorAddress: "0xce88686553686da562ce7cea497ce749da109f9f",
  },
};

export default CONFIG;
