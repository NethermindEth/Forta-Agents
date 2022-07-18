export const EVENTS = {
  Pause: "event Pause()",
  Unpause: "event Unpause()",
};

export const ABI = [
  "function setAdmin(address _admin)",
  "function setTreasury(address _treasury)",
  "function setPerformanceFee(uint256 _performanceFee)",
  "function setCallFee(uint256 _callFee)",
  "function setWithdrawFee(uint256 _withdrawFee)"
];

export const ALERTS: {[key:string]:string} = {
  Pause: "CAKE-VAULT-6-1",
  Unpause: "CAKE-VAULT-6-2",
  setAdmin: "CAKE-VAULT-6-3",
  setTreasury: "CAKE-VAULT-6-5",
  setPerformanceFee: "CAKE-VAULT-6-6",
  setCallFee: "CAKE-VAULT-6-7",
  setWithdrawFee: "CAKE-VAULT-6-8",
};
