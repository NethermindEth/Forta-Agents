import { utils } from "ethers";

// const moduleAbi: string = "function oracle() public view returns (Realitio)"; // ACTUALL, CHANGED TO returns (address) FOR TESTING
const moduleAbi: string = "function oracle() public view returns (address)";
export const moduleIFace = new utils.Interface([
    moduleAbi
]);

export const oracleAbi: string = "function getFinalizeTS(bytes32 question_id) public view returns(uint32)";
export const oracleIFace = new utils.Interface([
    oracleAbi
]);

export const propQuestionCreatedSig: string = "ProposalQuestionCreated(bytes32,string)";
export const propQuestionCreateAbi: string = "event ProposalQuestionCreated(bytes32 indexed questionId, string indexed proposalId)";