import { utils } from "ethers";

// const realitioErc20Abi: string = "function getFinalizeTS(bytes32 question_id) public view returns(uint32)";
const realitioErc20Abi: string = "function getFinalizeTS(uint32 question_id) public view returns(uint32)"; // NOTE: CHANGE THE TYPE OF question_id FOR TESTING
export const getFinalizeTSIface = new utils.Interface([realitioErc20Abi]);

export const propQuestionCreatedSig: string = "ProposalQuestionCreated(bytes32,string)";
export const propQuestionCreateAbi: string = "event ProposalQuestionCreated(bytes32 indexed questionId, string indexed proposalId)";