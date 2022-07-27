import { utils } from "ethers";
import { getCreate2Address } from "@ethersproject/address";
import { INIT_CODE_HASH } from "./constants";

// generate new pair address
export const createPair = (factory: string, token0: string, token1: string): string => {
  let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(factory, salt, INIT_CODE_HASH).toLowerCase();
};
