import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Addresses of stable pools to be monitored
    stablePoolAddresses: [
      "0x6641a8c1d33bd3dec8dd85e69c63cafb5bf36388",
      "0x9f19a375709baf0e8e35c2c5c65aca676c4c7191",
      "0xfeadd389a5c427952d8fdb8057d6c8ba1156cc56",
      "0x06df3b2bbb68adc8b0e302443692037ed9f91b42",
    ],

    // Absolute amplification parameter value at and below which a finding will be emitted (decimal places are not
    // considered) (optional)
    absoluteThreshold: "10000",

    // Minimum amplification parameter drop percentage from the previous value at and above which a finding will be
    // emitted (in %) (optional).
    percentageThreshold: "40.5",
  },

  [Network.POLYGON]: {
    stablePoolAddresses: ["0x06df3b2bbb68adc8b0e302443692037ed9f91b42"],
    absoluteThreshold: "10000",
    percentageThreshold: "40.5",
  },

  [Network.POLYGON]: {
    stablePoolAddresses: ["0x06df3b2bbb68adc8b0e302443692037ed9f91b42"],
    absoluteThreshold: "10000",
    percentageThreshold: "40.5",
  },
};

export default CONFIG;
