import { Finding, FindingSeverity, FindingType } from "forta-agent";
const axios = require("axios");
export const API_URL = "https://api.vesper.finance/dashboard?version=2";
const STATUS = "operative";
const ALLOWED_STAGES = ["prod", "beta", "orbit"];
const IGNORE_ADDRESS = ["0xbA4cFE5741b357FA371b506e5db0774aBFeCf8Fc"]; // vVSP pool

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

const getPools = async () => {
  return axios.get(API_URL).then((response: { data: { pools: any[] } }) => {
    return response.data.pools
      .filter(
        (pool: {
          status: string;
          stage: string;
          contract: { version: string; address: string };
        }) =>
          pool.status === STATUS &&
          ALLOWED_STAGES.includes(pool.stage) &&
          !IGNORE_ADDRESS.includes(pool.contract.address)
      )
      .map((pool) => pool.contract.address);
  });
};

export { mockList, getTotalValue, getTokensHere, createFinding, getPools };
