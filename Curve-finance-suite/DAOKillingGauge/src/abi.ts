import { ethers } from "ethers";

export const gaugeInterface = new ethers.utils.Interface([
  "function set_killed(bool _set_killed)",
]);
