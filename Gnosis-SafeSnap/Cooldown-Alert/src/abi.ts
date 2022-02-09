import { utils } from "ethers";

export const realitioErc20IFace = new utils.Interface([
    "function getFinalizeTS(bytes32 question_id) public view returns(uint32)",
]);

export const daoModuleAbi: string = "function questionCooldown() public view returns (uint32)";

export const realitioErc20Abi: string = "function getFinalizeTS(bytes32 question_id) public view returns(uint32)";

export const propQuestionCreatedSig: string = "ProposalQuestionCreated(bytes32,string)";
export const propQuestionCreateAbi: string = "event ProposalQuestionCreated(bytes32 indexed questionId, string indexed proposalId)";