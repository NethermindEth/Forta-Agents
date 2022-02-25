import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import agent, { provideHandleTransaction } from "./agent";
import {utils} from "ethers";
import  {
  FindingType,
  FindingSeverity,
  Finding,
  TransactionEvent,
  HandleTransaction
} from "forta-agent";
import {
  ADD_PROPOSOAL,
  ADD_PROPOSAL_WITH_NONCE,
  MARK_PROPOSAL_AS_INVALID,
  MARK_PROPOSAL_AS_INVALID_BY_HASH,
  MARK_PROPOSAL_WITH_EXPIRED_ANSWER_AS_INVALID,
  EXECUTE_PROPOSAL,
  EXECUTE_PROPOSAL_WITH_INDEX,
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
const zeroAddress: string = "0x0000000000000000000000000000000000000000";

const createTransaction = (functionName: string, params:any[]) => {
  return iface.encodeFunctionData(
    functionName, 
    [...params],
  );
};

const createFinding = (functionName: string, params: any) => {
  const metadata:any = {
    by: zeroAddress,
  };
  for(const key in params){
    metadata[key] = params[key].toString()
  };

  return Finding.fromObject({
    name: "Zodiac/Gnosis SafeSnap",
    description: `${functionName} execeuted`,
    alertId: "SafeSnap-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Gnosis SafeSnap",
    metadata: metadata,
  });
};

describe("Calls monitor agent", () => {
  const module: string = createAddress("0xdead");
  const handler: HandleTransaction = provideHandleTransaction(module);

  it("should detect addProposal function call", async () => {
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

    const Transaction: string = createTransaction("addProposal",[proposalId,txHashes]);
    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    const expectedFinding = createFinding("addProposal",{
      proposalId: proposalId,
      txHashes: txHashes[0],
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should detect addProposalWithNonce function call", async () => {
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    const nonce: string = "4";

    const Transaction: string = createTransaction("addProposalWithNonce",[proposalId,txHashes,nonce]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    const expectedFinding = createFinding("addProposalWithNonce",{
      proposalId: proposalId,
      txHashes: txHashes[0],
      nonce: nonce
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should detect markProposalAsInvalid function call", async () => {
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

    const Transaction: string = createTransaction("markProposalAsInvalid", [proposalId, txHashes]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    
    const expectedFinding = createFinding("markProposalAsInvalid", {
      proposalId: proposalId,
      txHashes: txHashes[0],
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should detect markProposalAsInvalidByHash function call", async () => {
    const questionHash: string = "0x6d6168616d000000000000000000000000000000000000000000000000000000";
    const Transaction: string = createTransaction("markProposalAsInvalidByHash", [questionHash]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    const expectedFinding = createFinding("markProposalAsInvalidByHash",{
      questionHash: questionHash,
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should detect markProposalWithExpiredAnswerAsInvalid function call", async () => {
    const questionHash: string = "0x6d6168616d000000000000000000000000000000000000000000000000000000";
    const Transaction: string = createTransaction("markProposalWithExpiredAnswerAsInvalid", [questionHash]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    const expectedFinding = createFinding("markProposalWithExpiredAnswerAsInvalid", {
      questionHash: questionHash,
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should detect executeProposal function call", async () => {
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    const to: string = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
    const value: string = "0";
    const data: string = "0x28ed4f6cd0185bc80db4dae66d986f141f5fe4797341406a201f5189027c6e6a775522c80000000000000000000000000a147ddf0817ade664eb9cb343d96a21ed857d11";
    const operation: string = "0";

    const Transaction: string = createTransaction("executeProposal", [proposalId, txHashes, to, value, data, operation]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    const expectedFinding = createFinding("executeProposal", {
      to: to,
      proposalId: proposalId,
      txHashes: txHashes[0],
      value: value,
      data: data,
      operation: operation,
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should detect executeProposalWithIndex function call", async () => {
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    const to: string = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
    const value: string = "0";
    const data: string = "0x28ed4f6cd0185bc80db4dae66d986f141f5fe4797341406a201f5189027c6e6a775522c80000000000000000000000000a147ddf0817ade664eb9cb343d96a21ed857d11";
    const operation: string = "0";
    const txIndex: string = "0";

    const Transaction: string = createTransaction("executeProposalWithIndex",[proposalId, txHashes, to, value, data, operation, txIndex]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(module);
    const findings = await handler(txEvent);
    const expectedFinding = createFinding("executeProposalWithIndex", {
      to: to,
      proposalId: proposalId,
      txHashes: txHashes[0],
      value: value,
      data: data,
      operation: operation,
      txIndex: txIndex,
    });

    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("should return no finding for other contract address", async ()=>{
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];

    const Transaction: string = createTransaction("addProposal", [proposalId, txHashes]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setData(Transaction).setTo(zeroAddress);
    const findings = await handler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings for multiple function calls in same Transaction", async ()=>{
    const proposalId: string = "QmWwo3TkBtUybd7wcwix6yuGtApR427FBCxiSGJNwowDoN";
    const txHashes: string[] = ["0x198752008246c30849803849ca78d3cdf204683715a591c62f3c9ef71cf63710"];
    const questionHash: string = "0x6d6168616d000000000000000000000000000000000000000000000000000000";
    const txEvent: TransactionEvent = new TestTransactionEvent().setTo(module).addTraces({
        to: module,
        from: zeroAddress,
        input: createTransaction("addProposal", [proposalId, txHashes])
      }, {
        to: module,
        from: zeroAddress,
        input: createTransaction("markProposalWithExpiredAnswerAsInvalid", [questionHash])
    });
    const expectedFindings: Finding[] = [
      createFinding("addProposal", {
        proposalId: proposalId,
        txHashes: txHashes,
      }),
      createFinding("markProposalWithExpiredAnswerAsInvalid", {
        questionHash: questionHash,
      }),
    ];

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual(expectedFindings);
  });
});
