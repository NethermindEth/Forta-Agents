import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import OracleFetcher from "./oracle.fetcher";
import {
  ANSWERS_EVENTS_SIGNATURES,
  QUESTION_CREATED_SIGNATURE,
  SAFESNAP_CONTRACT,
  createFinding,
} from "./utils";

const questions: string[] = [];

export const provideHandleTransaction =
  (reality_module: string, fetcher: OracleFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent
      .filterLog([QUESTION_CREATED_SIGNATURE], reality_module)
      .map((log) => {
        if (!questions.includes(log.args[0])) questions.push(log.args[0]); // save questionId if it doesn't exist.
      });
    if (questions.length === 0) return findings;

    // get the oracle address of reality module.
    const oracle = await fetcher.getOracle("latest", reality_module);

    // get answers events logs.
    txEvent.filterLog(ANSWERS_EVENTS_SIGNATURES, oracle).map((log) => {
      if (
        (log.name === "LogAnswerReveal" && questions.includes(log.args[0])) ||
        (log.name === "LogNewAnswer" && questions.includes(log.args[1]))
      )
        findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    SAFESNAP_CONTRACT,
    new OracleFetcher(getEthersProvider())
  ),
};
