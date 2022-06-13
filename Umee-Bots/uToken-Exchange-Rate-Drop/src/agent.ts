import { BlockEvent, Finding, HandleBlock, getEthersProvider, Initialize } from "forta-agent";
import Fetcher from "./fetcher";
import CONFIG from "./agent.config";
import { createFinding, getUTokenPrices, calculatePriceRatio, calculateSeverity } from "./utils";
import BigNumber from "bignumber.js";

BigNumber.set({ DECIMAL_PLACES: 18 });

let currentPrices = new Map();
let previousPrices = new Map();
let uTokenUnderlyingAddresses: { uTokenName: string; address: string }[];

export const provideInitialize =
  (fetcher: Fetcher, uTokens: any): Initialize =>
  async () => {
    //fetch underlying asset addresses of uTokens first
    uTokenUnderlyingAddresses = await Promise.all(
      uTokens.map(async (uToken: { uToken: string; address: string }) => {
        return {
          uTokenName: uToken.uToken,
          address: await fetcher.getUnderlyingAssetAddress(uToken.address, "latest"),
        };
      })
    );

    currentPrices = await getUTokenPrices(fetcher, uTokenUnderlyingAddresses, "latest");
  };

export const provideHandleBlock =
  (fetcher: Fetcher, uTokenPairs: any): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    previousPrices = currentPrices;

    currentPrices = await getUTokenPrices(fetcher, uTokenUnderlyingAddresses, blockEvent.blockNumber);

    uTokenPairs.forEach((pair: any) => {
      const previousRatio = calculatePriceRatio(previousPrices.get(pair.uToken1), previousPrices.get(pair.uToken2));
      const currentRatio = calculatePriceRatio(currentPrices.get(pair.uToken1), currentPrices.get(pair.uToken2));

      const difference = previousRatio.minus(currentRatio);

      // check  if the current pair ratio subtracted from the previous pair ratio is greater than or equal to the pair difference threshold
      if (difference.gte(pair.threshold)) {
        const severity = calculateSeverity(difference, pair.threshold, pair.difference);
        findings.push(createFinding(`${pair.uToken1}/${pair.uToken2}`, previousRatio, currentRatio, severity));
      }
    });

    return findings;
  };

export default {
  initialize: provideInitialize(new Fetcher(getEthersProvider(), CONFIG), CONFIG.uTokens),
  handleBlock: provideHandleBlock(new Fetcher(getEthersProvider(), CONFIG), CONFIG.uTokenPairs),
};
