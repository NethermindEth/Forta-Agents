import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  ethers,
  HandleTransaction,
} from "forta-agent";
import { BigNumber, utils, providers } from "ethers";

import util from "./utils";

const Qi_CONTRACT: string = "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5";
const AMOUNT_THRESHOLD: BigNumber = BigNumber.from(10 ** 6); // 1M USD

export const createFinding = (
  delegator: string,
  fromDelegate: string,
  toDelegate: string,
  balance: BigNumber
): Finding => {
  return Finding.fromObject({
    name: "Delegations Monitor",
    description: "Detect user with a huge balance delegating their votes",
    alertId: "BENQI-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "BENQI",
    metadata: {
      delegator: delegator.toLowerCase(),
      fromDelegate: fromDelegate.toLowerCase(),
      toDelegate: toDelegate.toLowerCase(),
      balance: balance.toString(),
    },
  });
};

export function provideHandleTransaction(
  amountThreshold: BigNumber,
  QiToken: string,

  provider: providers.Provider
): HandleTransaction {
  const BenQiContract = new ethers.Contract(
    QiToken,
    util.BALANCE_OF_FUNCTION,
    provider
  );
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const delegateChangedEvent = txEvent.filterLog(
      util.DELEGATE_CHANGED_EVENT,
      QiToken
    );

    if (delegateChangedEvent.length === 0) return findings;

    await Promise.all(
      delegateChangedEvent.map(async (event) => {
        const delegator = event.args.delegator;

        const balanceOfDelegator = await BenQiContract.balanceOf(delegator, {
          blockTag: txEvent.blockNumber,
        });
        if (balanceOfDelegator.gte(amountThreshold)) {
          const newFinding: Finding = createFinding(
            event.args.delegator,
            event.args.fromDelegate,
            event.args.toDelegate,
            balanceOfDelegator
          );
          findings.push(newFinding);
        }
      })
    );

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    AMOUNT_THRESHOLD,
    Qi_CONTRACT,
    getEthersProvider()
  ),
};
