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
    // considered) (optional).
    valueThreshold: "10000",

    // Minimum amplification parameter drop from the previous value at and above which a finding will be emitted
    // (decimal places are not considered) (optional).
    decreaseThreshold: "10000",

    // Minimum amplification parameter drop percentage from the previous value at and above which a finding will be
    // emitted (in %) (optional).
    decreasePercentageThreshold: "40.5",
  },

  [Network.POLYGON]: {
    stablePoolAddresses: [
      "0x6641a8c1d33bd3dec8dd85e69c63cafb5bf36388",
      "0x9f19a375709baf0e8e35c2c5c65aca676c4c7191",
      "0xfeadd389a5c427952d8fdb8057d6c8ba1156cc56",
      "0x06df3b2bbb68adc8b0e302443692037ed9f91b42",
    ],
    valueThreshold: "10000",
    decreaseThreshold: "10000",
    decreasePercentageThreshold: "40.5",
  },

  [Network.ARBITRUM]: {
    stablePoolAddresses: ["0x0510cCF9eB3AB03C1508d3b9769E8Ee2CFd6FDcF", "0x1533A3278f3F9141d5F820A184EA4B017fce2382"],
    valueThreshold: "10000",
    decreaseThreshold: "10000",
    decreasePercentageThreshold: "40.5",
  },
};

// Uncomment these lines for the mainnet test:

// CONFIG[Network.MAINNET].valueThreshold = "130000";
// CONFIG[Network.MAINNET].decreaseThreshold = "10000";
// CONFIG[Network.MAINNET].decreasePercentageThreshold = "10";

// Uncomment these lines for the testnet test:

// CONFIG[42] = {
//   stablePoolAddresses: [
//     "0x17Ba6D4f873A7E3197B21A5475562b284d415476",
//     "0x83e1bA0Fe48aB7c513039885956ec8492BF58E7b",
//     "0x542B13a5d5f81Ba47157691Db5323002CD942a9d",
//   ],
//   valueThreshold: "200",
//   decreaseThreshold: "100",
//   decreasePercentageThreshold: "20",
// };

export default CONFIG;
