import {
  ethers,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import utils from "./utils";

export const handleTransaction =
  (
    reflectTokenAddress: string,
    provider: ethers.providers.JsonRpcProvider
  ): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const tV2GeneralLogs = txEvent.filterLog(utils.EVENT_ABI);

    return findings;
  };

export default {
  handleTransaction: handleTransaction(
    utils.REFLECT_TOKEN_ADDRESS,
    utils.provider
  ),
};
