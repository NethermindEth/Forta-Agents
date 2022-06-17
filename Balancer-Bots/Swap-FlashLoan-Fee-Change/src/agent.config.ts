import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
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

// Uncomment these lines for the Kovan testnet test:
// CONFIG[42] = { protocolFeesCollectorAddress: "0x5EE8245edAAF0265232F877B36d7F3a96130Aa85" };

export default CONFIG;
