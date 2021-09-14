import { 
  Finding, 
  FindingSeverity, 
  FindingType, 
  HandleTransaction, 
  Trace, 
  TransactionEvent 
} from "forta-agent";
import { 
  TestTransactionEvent,
  createAddress,
  generalTestFindingGenerator,
} from "./tests.utils";
import Web3 from "web3";
import provideFunctionCallsDetectorAgent from "./function.calls";

const abi = new Web3().eth.abi;

describe("Function calls detector Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("Should returns empty findings if the expected function wasn't called", async () => {
    handleTransaction = provideFunctionCallsDetectorAgent(
      generalTestFindingGenerator, 
      "Func()",
    );

    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Should returns a findings only if the function is called in the contract target `to`", async () => {
    const signature: string = "Func()";
    const selector: string = abi.encodeFunctionSignature(signature);
    handleTransaction = provideFunctionCallsDetectorAgent(
      generalTestFindingGenerator,
      signature,
      { to: createAddress("0x0") },
    );

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTrace({
      to: createAddress("0x1"),
      input: selector,
    });
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTrace({
      to: createAddress("0x0"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("Should returns a findings only if the function is called from the caller target `from`", async () => {
    const signature: string = "Func()";
    const selector: string = abi.encodeFunctionSignature(signature);
    handleTransaction = provideFunctionCallsDetectorAgent(
      generalTestFindingGenerator, 
      signature,
      { from: createAddress("0x0") },
    );

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTrace({
      from: createAddress("0x1"),
      input: selector,
    });
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTrace({
      from: createAddress("0x0"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("Should returns a finding only if all the conditions are met", async () => {
    const signature: string = "Func()";
    const selector: string = abi.encodeFunctionSignature(signature);
    handleTransaction = provideFunctionCallsDetectorAgent(
      generalTestFindingGenerator, 
      signature,
      { 
        from: createAddress("0x1"),
        to: createAddress("0x2"),
      },
    );

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTrace({
      from: createAddress("0x0"),
      to: createAddress("0x2"),
      input: selector,
    });
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTrace({
      from: createAddress("0x1"),
      to: createAddress("0x0"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([]);

    const txEvent3: TransactionEvent = new TestTransactionEvent().addTrace({
      from: createAddress("0x0"),
      to: createAddress("0x3"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent3));
    expect(findings).toStrictEqual([]);

    const txEvent4: TransactionEvent = new TestTransactionEvent().addTrace({
      from: createAddress("0x1"),
      to: createAddress("0x2"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent4));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent4)]);
  });

  it("Should pass correct metadata to findingGenerator", async () => {
    const findingGenerator = (metadata: { [key: string]: any } | undefined): Finding => {
      return Finding.fromObject({
        name: "Test Name",
        description: "Test Description",
        alertId: "Test Id",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          from: metadata?.from,
          to: metadata?.to,
          input: metadata?.input,
        },
      });
    };
    const signature: string = "myMethod(uint256,string)";
    const input:string = abi.encodeFunctionCall({
      name: 'myMethod',
      type: 'function',
      inputs: [{
        type: 'uint256',
        name: 'myNumber',
      },{
        type: 'string',
        name: 'myString',
      }],
    }, ['2345675643', 'Hello!%']);

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    handleTransaction = provideFunctionCallsDetectorAgent(
      findingGenerator, 
      signature,
      { to, from },
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTrace({ to, from, input });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      findingGenerator({ to, from, input }),
    ]);
  });
});
