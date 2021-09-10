import { Finding, HandleTransaction, TransactionEvent, Log } from "forta-agent";
import { FindingGenerator } from "./utils";

const EVENT_SIGNATURE = "Transfer(address,address,uint256)";

type agentOptions = {
    to?: string,
    from?: string,
    amountThreshold?: string,
};

type transferInfo = {
    to: string,
    from: string,
    amountThreshold: string,
};

        if (txEvent.filterEvent(EVENT_SIGNATURE, tokenAddress).length > 0) {
            findings.push(findingGenerator(txEvent));
        }

        return findings;
    };
};

export default function provideERC20TransferAgent(
  findingGenerator: FindingGenerator,
  tokenAddress: string,
  agentOptions?: agentOptions
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.filterEvent(EVENT_SIGNATURE, tokenAddress).length > 0) {
      findings.push(findingGenerator(txEvent));
    }

    return findings;
  };
}
