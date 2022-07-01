import { utils } from "ethers";

type contractType = {
  BANANA_CONTRACT_ADDRESS_BSC: string;
  BANANA_CONTRACT_ADDRESS_POLYGON: string;
  BANANA_CONTRACT_ADDRESS_BSC_TESTNET: string;
  BANANA_MINT_FUNCTION: string;
  BANANA_MINT_FUNCTION_ABI: string[];
  BANANA_TOTAL_SUPPLY_ABI: string[];
};

export const BANANA_CONSTANTS: contractType = {
  BANANA_CONTRACT_ADDRESS_BSC: "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95",
  BANANA_CONTRACT_ADDRESS_POLYGON: "0x5d47bAbA0d66083C52009271faF3F50DCc01023C",
  BANANA_CONTRACT_ADDRESS_BSC_TESTNET: "0x4619d472a70868710fa9df96cf29e4b9772e62d9",
  BANANA_MINT_FUNCTION: "function mint(uint256 amount)",
  BANANA_MINT_FUNCTION_ABI: ["function mint(uint256 amount)"],
  BANANA_TOTAL_SUPPLY_ABI: ["function totalSupply() public view returns (uint256)"],
};

export const IBANANA: utils.Interface = new utils.Interface(BANANA_CONSTANTS.BANANA_TOTAL_SUPPLY_ABI);
