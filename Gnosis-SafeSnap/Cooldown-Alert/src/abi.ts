import { utils } from "ethers";

export const realitioErc20IFace = new utils.Interface([
    "function getFinalizeTS(bytes32 question_id) public view returns(uint32)",
]);

export const daoModuleAbi: string = "function questionCooldown() public view returns (uint32)";

/*
function getFinalizeTS(bytes32 question_id) 
public view returns(uint32) {
    return questions[question_id].finalize_ts;
}
*/