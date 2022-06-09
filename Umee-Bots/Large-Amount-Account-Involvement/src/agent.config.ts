export interface AgentConfig {
  threshold: number;
  monitoredAddresses: string[];
}

export const CONFIG: AgentConfig = {
  threshold: 20,
  monitoredAddresses: [
    "0xc0a4Df35568F116C370E6a6A6022Ceb908eedDaC", // Umee
    "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa", // Lending Pool
    "0x67386481E5A3076563F39831Bb79d05D393d57bf", // Umee Oracle
    "0x45cb9655f26992eac712ae5409b4079781968479", // A random user account
  ],
};

// Uncomment these lines for the mainnet test:

// CONFIG.monitoredAddresses = [
//   "0xc0a4Df35568F116C370E6a6A6022Ceb908eedDaC",
//   "0xcE744a9BAf573167B2CF138114BA32ed7De274Fa",
//   "0x67386481E5A3076563F39831Bb79d05D393d57bf",
//   "0x45cb9655f26992eac712ae5409b4079781968479",
// ];
// CONFIG.threshold = 20;

// Uncomment these lines for the testnet test:

// CONFIG.monitoredAddresses = [
//   "0x3526a2fe5dA32d0f0814086848628bF12A1E4417",
//   "0x96A2F421D0E1626C0728CaEd5F05cD629D9867dA",
// ];
// CONFIG.threshold = 15;
