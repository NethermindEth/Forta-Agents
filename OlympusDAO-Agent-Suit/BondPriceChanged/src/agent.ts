import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";
import { createFinding, getBondsContracts } from "./utils";
import { providers } from "ethers";

export const EVENT_ABI =
  "event BondPriceChanged(uint256 indexed priceInUSD, uint256 indexed internalPrice, uint256 indexed debtRatio)";

export const provideHandleTransaction = (
  redeemHelperAddress: string,
  provider: providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const bondsContracts = await getBondsContracts(
      redeemHelperAddress,
      txEvent.blockNumber,
      provider
    );

    for (let bondContract of bondsContracts) {
      findings.push(
        ...txEvent
          .filterLog(EVENT_ABI, bondContract)
          .map((log) =>
            createFinding(
              log.args["priceInUSD"].toString(),
              log.args["internalPrice"].toString(),
              log.args["debtRatio"].toString()
            )
          )
      );
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    "0xE1e83825613DE12E8F0502Da939523558f0B819E",
    getEthersProvider()
  ),
};
