import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { FindingGenerator, provideEventCheckerHandler } from "forta-agent-tools";
import AddressFetcher from "./address.fetcher";

export const MAKER_ESM_FIRE_EVENT_ABI = "event Fire()";
export const MAKER_ESM_FIRE_EVENT_SIGNATURE = "Fire()";

const createFindingGenerator = (alertID: string, ESM_address: string, _from: string): FindingGenerator => {
  return () =>
    Finding.fromObject({
      name: "Maker ESM Fire Event",
      description: "Fire event emitted.",
      alertId: alertID,
      severity: FindingSeverity.Critical,
      type: FindingType.Suspicious,
      protocol: "Maker",
      metadata: {
        ESM_address: ESM_address,
        from: _from,
      },
    });
};

const provideESMFireEventAgent = (_alertID: string, fetcher: AddressFetcher): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(_alertID, fetcher.esmAddress, txEvent.from),
      MAKER_ESM_FIRE_EVENT_ABI,
      fetcher.esmAddress
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMFireEventAgent;
