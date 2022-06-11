export interface AgentConfig {
  mediumGasThreshold: string;
  highGasThreshold: string;
  criticalGasThreshold: string;
  monitoredAddresses: string[];
}

export const CONFIG: AgentConfig = {
  // Gas thresholds for each finding type
  mediumGasThreshold: "1000000",
  highGasThreshold: "3000000",
  criticalGasThreshold: "7000000",
  
  // Addresses that need to be involved in the transaction in order for a finding to be emitted
  monitoredAddresses: [
    "0xc0a4Df35568F116C370E6a6A6022Ceb908eedDaC", // Umee
    "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa", // Lending Pool
    "0x67386481E5A3076563F39831Bb79d05D393d57bf", // Umee Oracle
  ],
};


// Uncomment these lines for the mainnet test:

// CONFIG.mediumGasThreshold = "300000";
// CONFIG.highGasThreshold = "400000";
// CONFIG.criticalGasThreshold = "500000";
// CONFIG.monitoredAddresses = [
//   "0xc0a4Df35568F116C370E6a6A6022Ceb908eedDaC",
//   "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
//   "0x67386481E5A3076563F39831Bb79d05D393d57bf",
//   "0x45cb9655f26992eac712ae5409b4079781968479",
// ];

// Uncomment these lines for the testnet test:

// CONFIG.monitoredAddresses = [
//   "0x3526a2fe5dA32d0f0814086848628bF12A1E4417",
//   "0x96A2F421D0E1626C0728CaEd5F05cD629D9867dA",
//   "0x00Cd6757A77014Ab83C9fCD46ea53Ce880bc31CB",
//   "0x091ba6e5046170bd29f83cca688b30c6840d6cf4",
// ];
// CONFIG.mediumGasThreshold = "1000000";
// CONFIG.highGasThreshold = "3000000";
// CONFIG.criticalGasThreshold = "7000000";
