// PGL Staking Contract address
export const PGL_STAKING_CONTRACT = "0x784DA19e61cf348a8c54547531795ECfee2AfFd1";
// Avalanche Testnet Staking contract address
export const TESTNET_PGL_STAKING = "0xC6A79ce121796A3d83F96242260b296370dA5346";

// `deposit`, `redeem` functions signatures
export const FUNCTION_SIGNATURES = [
  "function deposit(uint pglAmount) external",
  "function redeem(uint pglAmount) external",
];

// `totalSupplies` function signature, used to get the total PGL staked.
export const SUPPLIES_SIGNATURE = ["function totalSupplies() public view returns (uint)"];

//  percentage used to set the theshold
export const THRESHOLD_PERCENTAGE = 20;
