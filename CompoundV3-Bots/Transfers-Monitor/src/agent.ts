import {
  Finding,
  Initialize,
  HandleTransaction,
  TransactionEvent,
  ethers,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, TransferLog } from "./utils";
import { BUY_COLLATERAL_ABI, SUPPLY_ABI, TRANSFER_ABI } from "./constants";
import CONFIG from "./agent.config";
import { BigNumber, getDefaultProvider } from "ethers";
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

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const transferEvents: Set<any> = new Set([]);

    // Filter the transaction logs for Transfer events in base tokens.
    txEvent
      .filterLog(TRANSFER_ABI, networkManager.get("baseTokens"))
      .forEach((log) => {
        let cometAddressIndex = networkManager
          .get("cometAddresses")
          .indexOf(log.args.to);

        // If the transfer event is destined for a Comet contract with the same baseToken,
        // add it to the transferEvents set
        if (
          cometAddressIndex > -1 &&
          networkManager.get("cometAddresses")[cometAddressIndex] ===
            log.args.to &&
          log.address === networkManager.get("baseTokens")[cometAddressIndex]
        ) {
          transferEvents.add({
            from: log.args.from,
            index: cometAddressIndex,
            amount: log.args.amount,
          });
        }
      });

    if (transferEvents.size > 0) {
      // get all Supply and BuyCollateral events
      let supply_buy_events = new Set(
        txEvent.filterLog(
          [SUPPLY_ABI, BUY_COLLATERAL_ABI],
          networkManager.get("cometAddresses")
        )
      );

      // For each transfer event, if there is a matching Supply or BuyCollateral event,
      // remove both events from their respective sets
      transferEvents.forEach((transfer: TransferLog) => {
        let cometAddress = networkManager.get("cometAddresses")[transfer.index];

        for (let event of Array.from(supply_buy_events.values())) {
          if (event.name === "Supply") {
            if (
              event.address === cometAddress &&
              event.args.from === transfer.from &&
              BigNumber.from(event.args.amount).eq(transfer.amount)
            ) {
              supply_buy_events.delete(event);
              transferEvents.delete(transfer);
              break;
            }
          } else if (
            event.address === cometAddress &&
            event.args.buyer === transfer.from &&
            BigNumber.from(event.args.baseAmount).eq(transfer.amount)
          ) {
            supply_buy_events.delete(event);
            transferEvents.delete(transfer);
            break;
          }
        }
      });
      // Create finding for each Trasfer event that wasn't matched
      transferEvents.forEach((transferAlert) =>
        findings.push(
          createTransferFinding(
            networkManager.get("cometAddresses")[transferAlert.index],
            transferAlert.from,
            transferAlert.amount
          )
        )
      );
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getDefaultProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
