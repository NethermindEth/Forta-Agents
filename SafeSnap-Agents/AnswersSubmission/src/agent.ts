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

const FETCHER = new OracleFetcher(getEthersProvider());
const questions: string[] = [];
let oracle: string = "";

export const initialize = async () => {
  oracle = await FETCHER.getOracle("latest", SAFESNAP_CONTRACT);
};

export const provideHandleTransaction =
  (reality_module: string, _oracle: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (!_oracle) _oracle = oracle;

    txEvent
      .filterLog([QUESTION_CREATED_SIGNATURE], reality_module)
      .map((log) => {
        if (!questions.includes(log.args[0])) questions.push(log.args[0]); // save questionId if it doesn't exist.
      });
    if (questions.length === 0) return findings;

    // get answers events logs.
    txEvent.filterLog(ANSWERS_EVENTS_SIGNATURES, _oracle).map((log) => {
      if (
        (log.name === "LogAnswerReveal" && questions.includes(log.args[0])) ||
        (log.name === "LogNewAnswer" && questions.includes(log.args[1]))
      )
        findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  initialize,
  handleTransaction: provideHandleTransaction(SAFESNAP_CONTRACT, oracle),
};
