import {
  Finding,
  Initialize,
  HandleTransaction,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData, TransferLog } from "./utils";
import { BUY_COLLATERAL_ABI, SUPPLY_ABI, TRANSFER_ABI } from "./constants";
import CONFIG from "./agent.config";
import { BigNumber } from "ethers";
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
    const transferEvents: any[] = [];
    const cometContracts = networkManager.get("cometContracts");
    const cometAddresses = cometContracts.map((contract) => contract.address);

    // Filter the transaction logs for Transfer events in base tokens.
    txEvent
      .filterLog(
        TRANSFER_ABI,
        cometContracts.map((contract) => contract.baseToken)
      )
      .forEach((log) => {
        const destinationComet = cometContracts.find(
          (comet) => comet.address.toLowerCase() === log.args.to.toLowerCase()
        );
        if (
          destinationComet &&
          destinationComet.baseToken.toLowerCase() === log.address.toLowerCase()
        ) {
          transferEvents.push({
            destinationComet,
            from: log.args.from,
            amount: log.args.amount,
          });
        }
      });

    if (transferEvents.length > 0) {
      // get all Supply and BuyCollateral event logs
      const supplyBuyEvents = txEvent
        .filterLog([SUPPLY_ABI, BUY_COLLATERAL_ABI], cometAddresses)
        .map((e1) => ({ ...e1, matched: false }));

      transferEvents.forEach((transfer: TransferLog) => {
        const cometAddress = transfer.destinationComet.address;
        let transferMatched = false;

        for (const event of supplyBuyEvents) {
          if (!event.matched && event.address === cometAddress) {
            if (event.name === "Supply") {
              if (
                event.args.from === transfer.from &&
                BigNumber.from(event.args.amount).eq(transfer.amount)
              ) {
                event.matched = true;
                transferMatched = true;
                break;
              }
            } else if (
              event.args.buyer === transfer.from &&
              BigNumber.from(event.args.baseAmount).eq(transfer.amount)
            ) {
              event.matched = true;
              transferMatched = true;
              break;
            }
          }
        }
        if (!transferMatched)
          findings.push(
            createTransferFinding(
              transfer.destinationComet.address,
              transfer.from,
              transfer.amount
            )
          );
      });
    }
    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
