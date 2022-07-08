import { getCreate2Address } from "@ethersproject/address";
import { utils } from "ethers";
import { PAIR_INIT_CODE_HASH } from "./constants";

export const createPair = (token0: string, token1: string, factory: string): string => {
  let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(factory, salt, PAIR_INIT_CODE_HASH).toLowerCase();
};
