import { BlockEvent, Finding, TransactionEvent } from "forta-agent";

export type FindingGenerator = (
  event: TransactionEvent | BlockEvent
) => Finding;
