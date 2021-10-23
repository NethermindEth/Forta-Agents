import { Finding, FindingSeverity, FindingType } from "forta-agent";

const defaultList = [
  "0xcA0c34A3F35520B9490C1d58b35A19AB64014D80",
  "0x8d0b8e2b5584cE1487317f81Da7d97397eF3e899",
  "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217",
  "0x097ee00F42f9D7512929A6434185Ae94aC6dafD7",
];

const getTotalValue = async (contract: any) => {
  return await contract.methods.totalValue().call();
};

const getTokensHere = async (contract: any) => {
  return await contract.methods.tokensHere().call();
};
const getBPSValue = async (contract: any) => {
  return await contract.methods.MAX_BPS().call();
};
const getTotalDebtRatio = async (contract: any) => {
  return await contract.methods.totalDebtRatio().call();
};

const createFinding = (): Finding => {
  return Finding.fromObject({
    name: "Loss Reported",
    description: "A loss was reported by a V3 strategy",
    alertId: "Vesper-3",
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
  });
};

export {
  defaultList,
  getTotalValue,
  getTokensHere,
  getBPSValue,
  getTotalDebtRatio,
  createFinding,
};
