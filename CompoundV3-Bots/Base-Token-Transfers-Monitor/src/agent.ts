import { Finding, Initialize, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./utils";
import { BUY_COLLATERAL_ABI, SUPPLY_ABI, TRANSFER_ABI } from "./constants";
import CONFIG from "./agent.config";
import { createTransferFinding } from "./finding";

const networkManager = new NetworkManager(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const cometContracts = networkManager.get("cometContracts");
    const cometAddresses = cometContracts.map((contract) => contract.address.toLowerCase());
    const cometBaseTokens = cometContracts.map((contract) => contract.baseToken.toLowerCase());

    // filter the transaction logs for base tokens Transfer events
    const transferEvents = txEvent
      .filterLog(TRANSFER_ABI, cometBaseTokens)
      .filter((log) => {
        const cometIdx = cometAddresses.indexOf(log.args.to.toLowerCase());

        return cometIdx !== -1 && cometBaseTokens[cometIdx] === log.address.toLowerCase();
      })
      .map((log) => ({
        comet: log.args.to.toLowerCase(),
        from: log.args.from.toLowerCase(),
        amount: ethers.BigNumber.from(log.args.amount),
      }));

    if (!transferEvents.length) return findings;

    // filter Supply and BuyCollateral event logs
    const supplyOrBuyLogs = txEvent
      .filterLog([SUPPLY_ABI, BUY_COLLATERAL_ABI], cometAddresses)
      .map((log) => ({ ...log, matched: false }));

    transferEvents.forEach((transfer) => {
      const comet = transfer.comet;

      let transferMatched = false;

      for (const log of supplyOrBuyLogs) {
        if (log.matched || log.address.toLowerCase() !== comet) continue;

        if (log.name === "Supply") {
          if (transfer.from === log.args.from.toLowerCase() && transfer.amount.eq(log.args.amount)) {
            log.matched = true;
            transferMatched = true;
            break;
          }
        } else if (log.name === "BuyCollateral") {
          if (transfer.from === log.args.buyer.toLowerCase() && transfer.amount.eq(log.args.baseAmount)) {
            log.matched = true;
            transferMatched = true;
            break;
          }
        }
      }

      if (!transferMatched) {
        findings.push(
          createTransferFinding(networkManager.getNetwork(), transfer.comet, transfer.from, transfer.amount)
        );
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
