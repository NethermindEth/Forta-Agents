import { Finding, FindingType, FindingSeverity } from "forta-agent";
import {
  FindingGenerator,
  decodeFunctionCallParameters,
} from "forta-agent-tools";
import { AbiItem } from "web3-utils";
import Web3 from "web3";
import { ControllerABI, AddressListABI } from "./abi";

const controllerAddresss = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";


export const createFinding: FindingGenerator = (callInfo) => {
  const { 0: strategyAddress, 1: lossValue } = decodeFunctionCallParameters(
    ["address", "uint256"],
    callInfo?.input
  );

  return Finding.fromObject({
    name: "",
    description: "",
    alertId: "",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      strategyAddress: strategyAddress,
      lossValue: lossValue,
    },
  });
};

const getPools = async (web3: Web3): Promise<string[]> => {
  const pools: string[] = [];

  const controllerContract = new web3.eth.Contract(ControllerABI, controllerAddresss);
  const addressListAddress: string = await controllerContract.methods.pools().call();

  const addressListContract = new web3.eth.Contract(AddressListABI, addressListAddress);
  const poolsLength: number = Number(await addressListContract.methods.length().call());

  for (let i = 0; i < poolsLength; i++){
    const poolAddress = await addressListContract.methods.at(i).call();
    pools.push(poolAddress);
  }
  return pools;
};

// export const getPoolAccountants = async (web3: Web3): Promise<string[]> => {
// };
