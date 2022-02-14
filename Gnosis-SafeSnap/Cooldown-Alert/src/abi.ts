import { utils } from "ethers";

export const realitioIFace = new utils.Interface([
    "function getFinalizeTS(bytes32 question_id) public view returns(uint32)"
]);

export const propQuestionCreatedSig: string = "ProposalQuestionCreated(bytes32,string)";
export const propQuestionCreateAbi: string = "event ProposalQuestionCreated(bytes32 indexed questionId, string indexed proposalId)";