import { TestTransactionEvent } from "forta-agent-tools";
import agent from "./agent";
import {utils} from "ethers";
import  {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
  getJsonRpcUrl,
  TransactionEvent
} from "forta-agent";
import {
  ADD_PROPOSOAL,
  ADD_PROPOSAL_WITH_NONCE,
  MARK_PROPOSAL_AS_INVALID,
  MARK_PROPOSAL_AS_INVALID_BY_HASH,
  MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
  EXECUTE_PROPOSAL,
  EXECUTE_PROPOSAL_WITH_INDEX,
  GNOSIS_ADDRESS
} from "./constants";


const iface: utils.Interface = new utils.Interface([
  ADD_PROPOSOAL,
  ADD_PROPOSAL_WITH_NONCE,
  MARK_PROPOSAL_AS_INVALID,
  MARK_PROPOSAL_AS_INVALID_BY_HASH,
  MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
  EXECUTE_PROPOSAL,
  EXECUTE_PROPOSAL_WITH_INDEX,
]);
const zeroAddress:string = "0x0000000000000000000000000000000000000000"

const createTransaction = (functionName:string, params:any[]) => {
  return iface.encodeFunctionData(
    functionName, 
    [...params]
  );
}


const createFinding = (functionName:string, params: any) => {
  let metadata:any = {
    by: zeroAddress
  }
  for(let key in params){
    metadata[key] = params[key].toString()
  }

  return Finding.fromObject({
    name: "Zodiac/Gnosis SafeSnap",
    description: `${functionName} execeuted`,
    alertId: "SafeSnap-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: metadata
  })
}


describe("Monitor function", ()=>{
  it("Should execute addProposal function", async () => {
    let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

    const Transaction:string = createTransaction("addProposal",[proposalId,txHashes])
    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
    const findings = await agent.handleTransaction(txEvent);
    const expectedFinding = createFinding("addProposal",{
      proposalId: proposalId,
      txHashes: txHashes[0],
    })

    expect(findings).toStrictEqual([expectedFinding,]);
  })

  it("Should execute addProposalWithNonce function", async () => {
    let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    let nonce:string = "4"

    const Transaction:string = createTransaction("addProposalWithNonce",[proposalId,txHashes,nonce])

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
    const findings = await agent.handleTransaction(txEvent);
    const expectedFinding = createFinding("addProposalWithNonce",{
      proposalId: proposalId,
      txHashes: txHashes[0],
      nonce: nonce
    })

    expect(findings).toStrictEqual([expectedFinding,]);
  })

  it("Should execute markProposalAsInvalid function", async () => {
    let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

    const Transaction:string = createTransaction("markProposalAsInvalid",[proposalId,txHashes])

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
    const findings = await agent.handleTransaction(txEvent);
    
    const expectedFinding = createFinding("markProposalAsInvalid",{
      proposalId: proposalId,
      txHashes: txHashes[0],
    })

    expect(findings).toStrictEqual([expectedFinding,]);
  })

  it("Should execute markProposalAsInvalidByHash function", async () => {
    let questionHash:string = "0x6d6168616d000000000000000000000000000000000000000000000000000000";
    const Transaction:string = createTransaction("markProposalAsInvalidByHash",[questionHash])

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
    const findings = await agent.handleTransaction(txEvent);
    const expectedFinding = createFinding("markProposalAsInvalidByHash",{
      questionHash: questionHash,
    })

    expect(findings).toStrictEqual([expectedFinding,]);
  })

  it("Should execute markProposalWithExpiredAnswerAsInvalid function", async () => {
    let questionHash:string = "0x6d6168616d000000000000000000000000000000000000000000000000000000";
    const Transaction:string = createTransaction("markProposalWithExpiredAnswerAsInvalid",[questionHash])

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
    const findings = await agent.handleTransaction(txEvent);
    const expectedFinding = createFinding("markProposalWithExpiredAnswerAsInvalid",{
      questionHash: questionHash,
    })

    expect(findings).toStrictEqual([expectedFinding,]);
  })

  it("Should execute executeProposal function", async () => {
    let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    let to: string = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85"
    let value:string = "0"
    let data:string = "0x28ed4f6cd0185bc80db4dae66d986f141f5fe4797341406a201f5189027c6e6a775522c80000000000000000000000000a147ddf0817ade664eb9cb343d96a21ed857d11"
    let operation:string = "0"

    const Transaction:string = createTransaction("executeProposal",[proposalId,txHashes,to,value,data,operation])

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(GNOSIS_ADDRESS);
    const findings = await agent.handleTransaction(txEvent);
    const expectedFinding = createFinding("executeProposal",{
      to: to,
      proposalId: proposalId,
      txHashes: txHashes[0],
      value: value,
      data: data,
      operation: operation,
    })

    expect(findings).toStrictEqual([expectedFinding,]);

  });

  it("Should execute executeProposalWithIndex function", async () => {
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
    const expectedFinding = createFinding("executeProposalWithIndex",{
      to: to,
      proposalId: proposalId,
      txHashes: txHashes[0],
      value: value,
      data: data,
      operation: operation,
      txIndex: txIndex,
    })

    expect(findings).toStrictEqual([expectedFinding,]);
  });

  it("Should return no finding for other contract address", async ()=>{
    let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

    const Transaction:string = createTransaction("addProposal",[proposalId,txHashes])

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(zeroAddress);
    const findings = await agent.handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  })
  it("Should return findings for multiple function call in same Transaction", async ()=>{
    let proposalId:string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    let txHashes:string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    let questionHash:string = "0x6d6168616d000000000000000000000000000000000000000000000000000000";
    const txEvent: TransactionEvent = new TestTransactionEvent().setTo(GNOSIS_ADDRESS).addTraces({
        to: GNOSIS_ADDRESS,
        from: zeroAddress,
        input: createTransaction("addProposal",[proposalId,txHashes])
    },{
        to: GNOSIS_ADDRESS,
        from: zeroAddress,
        input: createTransaction("markProposalWithExpiredAnswerAsInvalid",[questionHash])
    });
    const expectedFinding: Finding[] = [];
    expectedFinding.push(createFinding("addProposal",{
        proposalId: proposalId,
        txHashes: txHashes,
      }))
    expectedFinding.push(createFinding("markProposalWithExpiredAnswerAsInvalid",{
        questionHash: questionHash,
    }))

    const findings = await agent.handleTransaction(txEvent);
    console.log(findings)
    expect(findings).toStrictEqual(expectedFinding);
  })





})
