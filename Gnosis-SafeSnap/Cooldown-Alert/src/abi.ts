import { utils } from "ethers";

const realitioErc20Abi: string = "function getFinalizeTS(bytes32 question_id) public view returns(uint32)";
const extraRealitioAbi: string = "function createTemplate(string content) public returns (uint256)";
export const getFinalizeTSIface = new utils.Interface([realitioErc20Abi, extraRealitioAbi]);

export const propQuestionCreatedSig: string = "ProposalQuestionCreated(bytes32,string)";
export const propQuestionCreateAbi: string = "event ProposalQuestionCreated(bytes32 indexed questionId, string indexed proposalId)";