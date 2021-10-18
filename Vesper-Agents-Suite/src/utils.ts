import { AbiItem } from "web3-utils";
import { decodeParameter } from "forta-agent-tools";
import Web3 from "web3";

const _web3: Web3 = new Web3();

export type PropertyFetcher = (...params: string[]) => Promise<any>;

const IsUnderWater_Json_Interface = {
  inputs: [],
  name: "isUnderwater",
  outputs: [{ internalType: "bool", name: "", type: "bool" }],
  stateMutability: "view",
  type: "function"
} as AbiItem;

export interface Strategy {
  address: string;
  tokens: [];
  info: string;
  weight: number;
}

export interface Pools {
  name: string;
  contract: Object;
  strategies: Array<Strategy>;
  strategy: Object;
  poolRewards: Object;
  status: string;
  stage: string;
}

export const decodeSingleParam = (ptype: string, encoded: string): any =>
  _web3.eth.abi.decodeParameters([ptype], encoded)[0];

export const IsUnderWaterCall = (addr: string): string =>
  _web3.eth.abi.encodeFunctionCall(IsUnderWater_Json_Interface, [addr]);

export const propertyFetcher =
  (
    web3Call: any,
    address: string,
    dataEncoder: any,
    type: string
  ): PropertyFetcher =>
  async (...params: string[]): Promise<any> => {
    const encodedValue = await web3Call({
      to: address,
      data: dataEncoder(...params)
    });
    return decodeParameter(type, encodedValue);
  };
