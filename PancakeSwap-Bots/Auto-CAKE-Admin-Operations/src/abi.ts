export const EVENT_ABI = ["event Pause()", "event Unpause()"];

export const FUNC_ABI = [
  "function setAdmin(address _admin)",
  "function setTreasury(address _treasury)",
  "function setPerformanceFee(uint256 _performanceFee)",
  "function setCallFee(uint256 _callFee)",
  "function setWithdrawFee(uint256 _withdrawFee)",
];

export const ALERTS: { [key: string]: string } = {
  Pause: "CAKE-6-1",
  Unpause: "CAKE-6-2",
  setAdmin: "CAKE-6-3",
  setTreasury: "CAKE-6-4",
  setPerformanceFee: "CAKE-6-5",
  setCallFee: "CAKE-6-6",
  setWithdrawFee: "CAKE-6-7",
};
