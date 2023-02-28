import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  Label,
  EntityType,
} from "forta-agent";
import { VictimIdentifier } from "forta-agent-tools";
import { keys } from "./keys";

const createPreparationStageFinding = (
  preparationStageVictims: Record<
    string,
    {
      protocolUrl: string;
      protocolTwitter: string;
      tag: string;
      holders: string[];
      confidence: number;
    }
  >
): Finding => {
  const labels: Label[] = [];
  let metadata: {
    [key: string]: string;
  } = {};
  let index = 1;

  // Iterate through the preparationStageVictims object
  for (const contract in preparationStageVictims) {
    const victim = preparationStageVictims[contract];
    // Add properties to the metadata object, using the index as a suffix
    metadata[`address${index}`] = contract;
    metadata[`tag${index}`] = victim.tag;
    metadata[`protocolUrl${index}`] = victim.protocolUrl;
    metadata[`protocolTwitter${index}`] = victim.protocolTwitter;
    /* 
      Add the victim's properties to the metadata object -
      If the number of victims is large, don't output the "holders" property to avoid
      "Cannot return more than 50kB of findings per request" error */
    if (Object.keys(preparationStageVictims).length < 4) {
      metadata[`holders${index}`] = victim.holders.join(", ");
    }
    index++;

    // Create a label for the victim
    labels.push({
      entity: contract,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: victim.confidence,
      remove: false,
    });
  }

  return Finding.fromObject({
    name: "Victim Identified - Preparation Stage",
    description: "A possible victim has been identified in the preparation stage of an attack",
    alertId: "VICTIM-IDENTIFIER-PREPARATION-STAGE",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata,
    labels,
  });
};

const createExploitationStageFinding = (
  exploitationStageVictims: Record<
    string,
    {
      protocolUrl: string;
      protocolTwitter: string;
      tag: string;
      holders: string[];
      confidence: number;
    }
  >
): Finding => {
  const labels: Label[] = [];
  let metadata: {
    [key: string]: string;
  } = {};
  let index = 1;

  // Iterate through the exploitationStageVictims object
  for (const contract in exploitationStageVictims) {
    const victim = exploitationStageVictims[contract];
    // Add properties to the metadata object, using the index as a suffix
    metadata[`address${index}`] = contract;
    metadata[`tag${index}`] = victim.tag;
    metadata[`protocolUrl${index}`] = victim.protocolUrl;
    metadata[`protocolTwitter${index}`] = victim.protocolTwitter;
    /* 
      Add the victim's properties to the metadata object -
      If the number of victims is large, don't output the "holders" property to avoid
      "Cannot return more than 50kB of findings per request" error */
    if (Object.keys(exploitationStageVictims).length < 4) {
      metadata[`holders${index}`] = victim.holders.join(", ");
    }
    index++;

    // Create a label for the victim
    labels.push({
      entity: contract,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: victim.confidence,
      remove: false,
    });
  }
  return Finding.fromObject({
    name: "Victim Identified - Exploitation Stage",
    description: "A possible victim has been identified in the exploitation stage of an attack",
    alertId: "VICTIM-IDENTIFIER-EXPLOITATION-STAGE",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata,
    labels,
  });
};

let st = new Date().getTime();
let lastBlock = 0;
let transactionsProcessed = 0;
export const provideHandleTransaction =
  (victimsIdentifier: VictimIdentifier): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    if (txEvent.blockNumber != lastBlock) {
      lastBlock = txEvent.blockNumber;
      let et = new Date().getTime();
      console.log(`--------Block ${lastBlock - 1} took ${et - st} ms--------`);
      console.log(`-----Transactions processed: ${transactionsProcessed}-----`);
      transactionsProcessed = 0;
      st = et;
    }
    const findings: Finding[] = [];

    const victims = await victimsIdentifier.getIdentifiedVictims(txEvent);

    if (Object.keys(victims.preparationStage).length > 0) {
      findings.push(createPreparationStageFinding(victims.preparationStage));
    }
    if (Object.keys(victims.exploitationStage).length > 0) {
      findings.push(createExploitationStageFinding(victims.exploitationStage));
    }

    transactionsProcessed++;
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(new VictimIdentifier(getEthersProvider(), keys)),
};
