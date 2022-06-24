import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // The address of the DelegateRegistry contract
  delegateRegistryAddress: "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446",

  // The address of the veBAL token contract
  veBalTokenAddress: "0xC128a9954e6c874eA3d62ce62B468bA073093F25",

  // Minimum amount of veBAL that, when delegated, leads to a finding (optional)
  absoluteThreshold: "1000", // Token decimal places are not considered

  // Minimum percentage of veBAL total supply that, when delegated, leads to a finding (optional) (in %)
  supplyPercentageThreshold: "50.5", // 50.5%
};

// Uncomment these lines for the mainnet test:
// CONFIG.absoluteThreshold = "10000000000000000000000";
// CONFIG.supplyPercentageThreshold = "1.5";

export default CONFIG;
