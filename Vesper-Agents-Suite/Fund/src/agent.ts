import { Finding, getJsonRpcUrl, BlockEvent, HandleBlock } from "forta-agent";
import BigNumber from "bignumber.js";
import abi from "./pool.abi";
import Web3 from "web3";
import {
  getBPSValue,
  getTokensHere,
  getTotalDebtRatio,
  getTotalValue,
  createFinding,
  getPools,
} from "./utils";

const web3 = new Web3(getJsonRpcUrl());

// pool.tokenHere() - pool.totalValue()*(MAX_BPS-totalDebtRatio) > 10% of pool.totalValue()

function provideHandleFunction(web3: Web3): HandleBlock {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;

    const pools: any = await getPools(web3, blockNumber);

    for (let x = 0; x < pools.length; x++) {
      const contract = new web3.eth.Contract(abi as any, pools[x]);
      const totalValue = new BigNumber(
        await getTotalValue(contract, blockNumber)
      );
      const tokenHere = new BigNumber(
        await getTokensHere(contract, blockNumber)
      );
      let MAX_BPS;
      try {
        MAX_BPS = new BigNumber(await getBPSValue(contract, blockNumber));
      } catch (e) {
        continue;
      }
      const totalDebtRatio = new BigNumber(
        await getTotalDebtRatio(contract, blockNumber)
      );
      let idleFunds;
      if (MAX_BPS)
        idleFunds = tokenHere.minus(
          totalValue.multipliedBy(MAX_BPS.minus(totalDebtRatio))
        );

      if (idleFunds)
        if (idleFunds.isGreaterThan(totalValue.multipliedBy(0.1))) {
          findings.push(createFinding(idleFunds.toNumber()));
        }
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
