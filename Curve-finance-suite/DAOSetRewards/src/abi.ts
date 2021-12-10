import { ethers } from "ethers";

export const gaugeInterface = new ethers.utils.Interface([
  "function set_rewards(address _reward_contract, bytes32 _sigs, address[8] _reward_tokens)",
]);
