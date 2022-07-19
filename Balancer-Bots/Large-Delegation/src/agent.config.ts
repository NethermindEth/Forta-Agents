import { AgentConfig } from "./utils";

const CONFIG: AgentConfig = {
  // The address of the DelegateRegistry contract
  delegateRegistryAddress: "0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446",

  // The address of the veBAL token contract
  veBalTokenAddress: "0xC128a9954e6c874eA3d62ce62B468bA073093F25",

  // Minimum amount of veBAL that, when delegated, leads to a finding (optional)
  absoluteThreshold: "100000000000000000000000", // Token decimal places are not considered

  // Minimum percentage of veBAL total supply that, when delegated, leads to a finding (optional) (in %)
  supplyPercentageThreshold: "50.5", // 50.5%
};

// Uncomment these lines for the mainnet test:
// CONFIG.absoluteThreshold = "10000000000000000000000";
// CONFIG.supplyPercentageThreshold = "1.5";

// Uncomment these lines for the testnet test:
// CONFIG.delegateRegistryAddress = "0xA768d20A305BC3980FC8Fbe0A848454162c1b7b1";
// CONFIG.veBalTokenAddress = "0x3D669B6DBce3f3225C1CfaE36D209E81eF4BfABF";
// CONFIG.absoluteThreshold = "100";
// CONFIG.supplyPercentageThreshold = "20";

export default CONFIG;
