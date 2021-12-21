import { Finding, getJsonRpcUrl, BlockEvent, HandleBlock } from "forta-agent";
import BigNumber from "bignumber.js";
import abi from "./pool.abi";
import Web3 from "web3";
import { getTokensHere, getTotalValue, createFinding, getPools } from "./utils";

const web3 = new Web3(getJsonRpcUrl());

// pool.tokenHere()> 20% of pool.totalValue()

function provideHandleFunction(web3: Web3): HandleBlock {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;

    const pools: any = await getPools(web3, blockNumber);
    const promises: Promise<[any, any, any]>[] = [];
    pools.forEach((value: string) => {
      const contract = new web3.eth.Contract(abi as any, value);
      const totalValue = getTotalValue(contract, blockNumber);
      const tokenHere = getTokensHere(contract, blockNumber);
      promises.push(Promise.all([value, totalValue, tokenHere]));
    });

    const result = await Promise.all(promises as any);

    result.forEach((value: any) => {
      const pool = value[0];
      const totalValue = new BigNumber(value[1]);
      const tokenHere = new BigNumber(value[2]);

      if (tokenHere.isGreaterThan(totalValue.multipliedBy(0.2))) {
        findings.push(createFinding(pool, tokenHere.toNumber()));
      }
    });

    return findings;
  };
}

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
