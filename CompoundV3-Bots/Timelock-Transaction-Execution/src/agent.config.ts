import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.POLYGON]: {
    cometAddresses: ["0xF25212E676D1F7F89Cd72fFEe66158f541246445"],
    bridgeReceiverAddress: "0x18281dfC4d00905DA1aaA6731414EABa843c468A",
  },
};

export default CONFIG;
