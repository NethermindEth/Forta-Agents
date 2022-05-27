import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";

import { utils } from "ethers";

// The address of Swap v3 Factory
const SWAP_FACTORY_ADDRESS: string = "0x4233Ad9B8B7C1CCf0818907908A7f0796A3dF85F";

// The signature of the PairCreated event
const PAIRCREATED_EVENT_ABI: string =
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)";

// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Initialize the finding array
    let findings: Finding[] = [];

    // Get all PairCreated events
    const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);

    // For each PairCreated event create a finding
    for (let i = 0; i < pairCreatedEvents.length; i++) {
      findings.push(
        Finding.fromObject({
          name: "New pair created",
          description: "A new pair has been created in Swap Factory V3",
          alertId: alertId,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Impossible Finance",
          metadata: {
            token0: pairCreatedEvents[i].args.token0.toLowerCase(),
            token1: pairCreatedEvents[i].args.token1.toLowerCase(),
            pair: pairCreatedEvents[i].args.pair.toLowerCase(),
          },
        })
      );
    }

    // Return the finding array
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction("IMPOSSIBLE-7", SWAP_FACTORY_ADDRESS),
};
