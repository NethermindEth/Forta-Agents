import { Finding, FindingSeverity, FindingType } from "forta-agent";
import Web3 from "web3";
import { ControllerABI, AddressListABI } from "./abi";

const controllerAddress = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";

const mockList = [
  "0xcA0c34A3F35520B9490C1d58b35A19AB64014D80",
  "0x8d0b8e2b5584cE1487317f81Da7d97397eF3e899",
  "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217",
  "0x097ee00F42f9D7512929A6434185Ae94aC6dafD7",
];

const getTotalValue = async (contract: any, blockNumber: number) => {
  const value = await contract.methods.totalValue().call({}, blockNumber);
  return value;
};

const getTokensHere = async (contract: any, blockNumber: number) => {
  return await contract.methods.tokensHere().call({}, blockNumber);
};

const createFinding = (pool: any, tokenfunds = 0): Finding => {
  return Finding.fromObject({
    name: "Pool Fund's Report",
    description: "The idle funds in the pool > 35% of total value",
    alertId: "Vesper-3",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pool,
      tokenfunds: tokenfunds.toString(),

    },
  });
};

const getPools = async (
  web3: Web3,
  blockNumber: string | number
): Promise<string[]> => {
  const pools: string[] = [];

  const controllerContract = new web3.eth.Contract(
    ControllerABI,
    controllerAddress
  );
  const addressListAddress: string = await controllerContract.methods
    .pools()
    .call({}, blockNumber);

  const addressListContract = new web3.eth.Contract(
    AddressListABI,
    addressListAddress
  );
  const poolsLength: number = Number(
    await addressListContract.methods.length().call({}, blockNumber)
  );

  for (let i = 0; i < poolsLength; i++) {
    const poolAddress = await addressListContract.methods
      .at(i)
      .call({}, blockNumber);
    pools.push(poolAddress);
  }
  return pools;
};

export { mockList, getTotalValue, getTokensHere, createFinding, getPools };
