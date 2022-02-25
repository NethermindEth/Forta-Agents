import { LogDescription } from "ethers/lib/utils";
import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const EVENTS_SIGNATURES = [
  "event LogNewAnswer(bytes32 answer, bytes32 indexed question_id, bytes32 history_hash, address indexed user, uint256 bond, uint256 ts, bool is_commitment)",
  "event LogAnswerReveal(bytes32 indexed question_id, address indexed user, bytes32 indexed answer_hash, bytes32 answer, uint256 nonce, uint256 bond)",
  "event LogFinalize(bytes32 indexed question_id,bytes32 indexed answer)",
];

export const REALITY_ABI = new Interface([
  "function oracle() view returns (address)",
]);
export const ORACLE_ABI = new Interface(EVENTS_SIGNATURES);

export const createFinding = (log: LogDescription) => {
  switch (log.name) {
    case "LogNewAnswer":
      return Finding.fromObject({
        name: "Answers submission alert",
        description: "An answer has been submitted to a question",
        alertId: "GNOSIS-3-1",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: log.args[1],
          answer: log.args[0],
          user: log.args[3].toLowerCase(),
          commitment: log.args[6] ? "yes" : "no",
        },
      });
    case "LogAnswerReveal":
      return Finding.fromObject({
        name: "Answers submission alert",
        description: "An answer has been revealed",
        alertId: "GNOSIS-3-2",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: log.args[0],
          answer: log.args[3],
          user: log.args[1].toLowerCase(),
        },
      });
    default:
      // Log Finalize
      return Finding.fromObject({
        name: "Question finalized alert",
        description: "A question has been finalized",
        alertId: "GNOSIS-3-3",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: log.args[0],
          answer: log.args[1],
        },
      });
  }
};
