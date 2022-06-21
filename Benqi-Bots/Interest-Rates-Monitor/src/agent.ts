import { BigNumber } from "ethers";
import { findingCase, createFinding } from "./findings";
import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { COMPTROLLER_ADDR, COMPTROLLER_IFACE, EXCLUDED_MARKETS, THRESHOLDS } from "./utils";
import Fetcher from "./fetcher";

const fetcher: Fetcher = new Fetcher(getEthersProvider(), COMPTROLLER_ADDR);

const provideInitialize = (excludedMarkets: string[]) => async () => {
  await fetcher.getMarkets();
  fetcher.excludeMarkets(excludedMarkets);
};

export const provideHandleBlock =
  (thresholds: { supply: BigNumber[]; borrow: BigNumber[] }, fetcher: Fetcher): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const block: number = blockEvent.blockNumber;

    // Check if any new QiTokens have been added to Comptroller.
    const filter = {
      address: COMPTROLLER_ADDR,
      blockHash: blockEvent.blockHash,
      topics: [COMPTROLLER_IFACE.getEventTopic("MarketListed")],
    };
    (await fetcher.provider.getLogs(filter)).forEach((log) => {
      // update the markets array with the new markets.
      fetcher.updateMarkets(
        COMPTROLLER_IFACE.decodeEventLog(COMPTROLLER_IFACE.getEvent("MarketListed"), log.data).qiToken
      );
    });

    //Fetch and store supply and borrow interest rates for every Qi token
    const qiTokenSupplyInterestRate: BigNumber[] = await Promise.all(
      fetcher.markets.map((qiToken) => fetcher.getSupplyInterestRates(block, qiToken))
    );
    const qiTokenBorrowInterestRate: BigNumber[] = await Promise.all(
      fetcher.markets.map((qiToken) => fetcher.getBorrowInterestRates(block, qiToken))
    );

    //Check conditions to create finding
    qiTokenSupplyInterestRate.forEach((supplyRate, i) => {
      //Lower supply threshold check
      if (supplyRate.lt(thresholds.supply[0])) {
        findings.push(createFinding(fetcher.markets[i], supplyRate, thresholds.supply[0], findingCase[0]));
      } //Upper supply threshold check
      else if (supplyRate.gt(thresholds.supply[1])) {
        findings.push(createFinding(fetcher.markets[i], supplyRate, thresholds.supply[1], findingCase[1]));
      }
    });

    qiTokenBorrowInterestRate.forEach((borrowRate, i) => {
      //Lower borrow threshold check
      if (borrowRate.lt(thresholds.borrow[0])) {
        findings.push(createFinding(fetcher.markets[i], borrowRate, thresholds.borrow[0], findingCase[2]));
      } //Upper borrow threshold check
      else if (borrowRate.gt(thresholds.borrow[1])) {
        findings.push(createFinding(fetcher.markets[i], borrowRate, thresholds.borrow[1], findingCase[3]));
      }
    });

    return findings;
  };

export default {
  initialize: provideInitialize(EXCLUDED_MARKETS),
  handleBlock: provideHandleBlock(THRESHOLDS, fetcher),
};
