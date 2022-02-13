import  {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
  getJsonRpcUrl,
  TransactionEvent
} from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools";
import {
  ADD_PROPOSOAL,
  EXECUTE_PROPOSAL_WITH_INDEX,
  GNOSIS_ADDRESS
} from "./constants";

import agent from "./agent";
import {utils} from "ethers";

const iface: utils.Interface = new utils.Interface([ADD_PROPOSOAL,EXECUTE_PROPOSAL_WITH_INDEX]);
const zeroAddress:string = "0x0000000000000000000000000000000000000000"

const createTransaction = (functionName:string, params:any[]) => {
  return iface.encodeFunctionData(
    functionName, 
    [...params]
  );
}

test("addProposal executed", async () => {
  let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
  let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

  const Transaction:string = createTransaction("addProposal",[proposalId,txHashes])

  const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
  const findings = await agent.handleTransaction(txEvent);
  expect(findings).toStrictEqual([
    Finding.fromObject({
      name: "GNOSIS",
      description: "addProposal execeuted",
      alertId: "FORTA-8",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        by: zeroAddress,
        proposalId: proposalId,
        txHashes: txHashes[0],
      }
    }),
  ]);
})

test("executeProposalWithIndex executed", async () => {
  // Params for `executeProposalWithIndex` function
  let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
  let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
  let to: string = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85"
  let value:string = "0"
  let data:string = "0x28ed4f6cd0185bc80db4dae66d986f141f5fe4797341406a201f5189027c6e6a775522c80000000000000000000000000a147ddf0817ade664eb9cb343d96a21ed857d11"
  let operation:string = "0"
  let txIndex:string = "0"

  const Transaction:string = createTransaction("executeProposalWithIndex",[proposalId,txHashes,to,value,data,operation,txIndex])

  const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
  const findings = await agent.handleTransaction(txEvent);
  expect(findings).toStrictEqual([
    Finding.fromObject({
      name: "GNOSIS",
      description: "executeProposalWithIndex execeuted",
      alertId: "FORTA-8",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        by: zeroAddress,
        to: to,
        proposalId: proposalId,
        txHashes: txHashes[0],
        value: value,
        data: data,
        operation: operation,
        txIndex: txIndex
      }
    }),
  ]);
});