import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";
import { createFinding, getBondsContracts } from "./utils";
import { providers } from "ethers";

export const EVENT_ABI =
  "event ControlVariableAdjustment(uint256 initialBCV, uint256 newBCV, uint256 adjustment, bool addition)";

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
              log.args["initialBCV"].toString(),
              log.args["newBCV"].toString(),
              log.args["adjustment"].toString(),
              log.args["addition"].toString()
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
