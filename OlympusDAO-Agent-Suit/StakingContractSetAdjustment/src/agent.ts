import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding } from "./utils";
import { utils } from "ethers";

export const FUNCTION_ABI =
  "function setAdjustment(uint256 _index, bool _add, uint256 _rate, uint256 _target)";

export const STAKING_CONTRACT_ADDRESS =
  "0xc58e923bf8a00e4361fe3f4275226a543d7d3ce6";

export const provideHandleTransaction = (
  stakingContractAddress: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const callsToAdjustment = txEvent.filterFunction(
      FUNCTION_ABI,
      stakingContractAddress
    );
    return callsToAdjustment.map(
      (callsToAdjustment: utils.TransactionDescription) =>
        createFinding(
          callsToAdjustment.args["_index"].toString(),
          callsToAdjustment.args["_add"].toString(),
          callsToAdjustment.args["_rate"].toString(),
          callsToAdjustment.args["_target"].toString()
        )
    );
  };
};

export default {
  handleTransaction: provideHandleTransaction(STAKING_CONTRACT_ADDRESS),
};
