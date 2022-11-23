import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    compoundComptrollerAddress: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
  },

  [Network.GOERLI]: {
    compoundComptrollerAddress: "0xD2C5a5ea72A7419A7AFC87697E60796a56F2763E",
  },
};

export default CONFIG;
