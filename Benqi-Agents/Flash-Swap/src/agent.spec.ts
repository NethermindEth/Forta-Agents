import {
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent
} from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import {
  SWAP_ABI,
  createFinding
} from "./utils";

const testPglContract: string = createAddress("0xab01");
const testMsgSender: string = createAddress("0xac02");

const testSwapIFace = new utils.Interface([SWAP_ABI]);

// Format: amount0Out, amount1Out, to, data
const testCases: any[][] = [
  [100, 100, createAddress("0xab03"), "0x12ab"],
  [300, 300, createAddress("0xac04"), "0x34ac"],
  [500, 500, createAddress("0xad05"), "0x45ad"],
  [800, 800, createAddress("0xae06"), ""]
];

const encodedSwapCalls: string[] = [
  testSwapIFace.encodeFunctionData("swap", testCases[0]),
  testSwapIFace.encodeFunctionData("swap", testCases[1]),
  testSwapIFace.encodeFunctionData("swap", testCases[2]),
  testSwapIFace.encodeFunctionData("swap", testCases[3])
];

describe("Flash Swap agent alert test suite", () => {
  let handleTransaction: HandleTransaction

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(testPglContract);
  })

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  })

  it("should ignore swap function calls to the wrong contract", async () => {
    const wrongContract: string = createAddress("0xD3ad");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(wrongContract)
      .addTraces({
        from: testMsgSender,
        to: wrongContract,
        input: encodedSwapCalls[0]
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  })

  it("should ignore function calls to the wrong function in the right contract", async () => {
    const wrongAbi: string = "function burn(address to)";
    const wrongIFace = new utils.Interface([wrongAbi]);
    const wrongFuncCall: string = wrongIFace.encodeFunctionData("burn", [createAddress("0xde4D")]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testPglContract)
      .addTraces({
        from: testMsgSender,
        to: testPglContract,
        input: wrongFuncCall
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  })

  it("should return multiple Findings from calls to swap function when 'data.length' is more than zero", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testPglContract)
      .addTraces({
        from: testMsgSender,
        to: testPglContract,
        input: encodedSwapCalls[1]
      })
      .addTraces({
        from: testMsgSender,
        to: testPglContract,
        input: encodedSwapCalls[2]
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testCases[1][0].toString(),
        testCases[1][1].toString(),
        testCases[1][2]
      ),
      createFinding(
        testCases[2][0].toString(),
        testCases[2][1].toString(),
        testCases[2][2]
      )
    ]);
  })

  it("should ignore calls to swap function when 'data.length' is zero", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testPglContract)
      .addTraces({
        from: testMsgSender,
        to: testPglContract,
        input: encodedSwapCalls[3]
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  })
})
