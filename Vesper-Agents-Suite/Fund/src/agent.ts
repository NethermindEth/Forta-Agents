import { Finding, getJsonRpcUrl, BlockEvent, HandleBlock } from "forta-agent";

import abi from "./pool.abi";
import Web3 from "web3";
import {
  getBPSValue,
  getTokensHere,
  getTotalDebtRatio,
  getTotalValue,
  createFinding,
} from "./utils";

import axios, { Axios } from "axios";

const web3 = new Web3(getJsonRpcUrl());

// pool.tokenHere() - pool.totalValue()*(MAX_BPS-totalDebtRatio) > 10% of pool.totalValue()

function provideHandleFunction(web3: Web3, axios: Axios): HandleBlock {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const pools = await axios.get<any, any>("https://api.vesper.finance/pools");

    for (let x = 0; x < pools.length; x++) {
      const contract = new web3.eth.Contract(abi as any, pools[x].address);

      const totalValue = await getTotalValue(contract);
      const tokenHere = await getTokensHere(contract);
      const MAX_BPS = await getBPSValue(contract);
      const totalDebtRatio = await getTotalDebtRatio(contract);

      const idleFunds = tokenHere - totalValue * (MAX_BPS * totalDebtRatio);

      if (idleFunds > 0.1 * totalValue) {
        findings.push(createFinding(idleFunds));
      }
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleFunction(web3, axios),
  provideHandleFunction,
};
