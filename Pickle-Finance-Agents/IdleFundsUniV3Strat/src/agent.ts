import {
  BlockEvent,
  HandleBlock,
  getEthersProvider,
  Finding,
} from "forta-agent";
import {
  getStrategies,
  getIdleFunds,
  getTotalFunds,
  createFinding,
} from "./utils";
import { BigNumberish, providers } from "ethers";

const KEEPER_ADDRESS = "0xCd2e473DD506DfaDeeA81371053c307a24C05e6D";
const THRESHOLD = 25;

export const provideHandleBlock = (
  keeperAddress: string,
  threshold: BigNumberish,
  provider: providers.Provider
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const strategies = await getStrategies(
      keeperAddress,
      blockEvent.blockNumber,
      provider
    );

    const idleFundPromises = strategies.map((strategy: string) =>
      getIdleFunds(strategy, blockEvent.blockNumber, provider)
    );
    const totalFundPromises = strategies.map((strategy: string) =>
      getTotalFunds(strategy, blockEvent.blockNumber, provider)
    );

    const idleFunds = await Promise.all(idleFundPromises);
    const totalFunds = await Promise.all(totalFundPromises);

    for (let i = 0; i < strategies.length; i++) {
      if (idleFunds[i].eq(0) || totalFunds[i].eq(0)) {
        continue;
      }

      const idleFundsPercent = idleFunds[i].mul(100).div(totalFunds[i]);
      if (idleFundsPercent > threshold) {
        findings.push(
          createFinding(strategies[i], idleFundsPercent.toString())
        );
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(
    KEEPER_ADDRESS,
    THRESHOLD,
    getEthersProvider()
  ),
};
