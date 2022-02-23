import { utils } from "ethers";

export const workerConfigInterface = new utils.Interface([
  "function isStable(address worker) external view returns (bool)",
]);
