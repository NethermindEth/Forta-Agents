import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import {
  TestTransactionEvent,
  createAddress,
  encodeFunctionCall,
  encodeParameters,
  encodeParameter,
} from "forta-agent-tools";
import { reportLossABI, earningReportedSignature } from "./abi";
import { generateMockBuilder } from "./mockContract";
const axios = require('axios');
jest.mock('axios');

const strategyAddresses = [createAddress("0x2"), createAddress("0x3")];
const poolAccountants = [createAddress("0x0"), createAddress("0x1")];
const mockWeb3 = {
  eth: { Contract: generateMockBuilder() },
} as any;

const createFinding = (strategyAddress: string, lossValue: string): Finding => {
  return Finding.fromObject({
    name: "Loss Reported",
    description: "A loss was reported by a V3 strategy",
    alertId: "Vesper-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress: strategyAddress,
      lossValue: lossValue,
    },
  });
};

describe("Reported Loss Agent", () => {
  beforeEach(async () => {
    const poolAddress = createAddress("0x0")
    const pools = {
      data: {
        pools: [
          {
            contract: {
              address: poolAddress,
            },
            status: "operative",
            stage: "prod"
          },
        ],
      },
    } as any;
    (axios.get as jest.Mock).mockResolvedValue(pools);
  });

  let handleTransaction: HandleTransaction;

  it("should return empty findings if not reportLoss is called", async () => {
    handleTransaction = provideHandleTransaction(mockWeb3);

    let findings: Finding[] = [];
    const txEvent: TransactionEvent = new TestTransactionEvent();
    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([]);
  });

  it("should returns finding if reportLoss was called", async () => {
    handleTransaction = provideHandleTransaction(mockWeb3);
    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      input: encodeFunctionCall(reportLossABI as any, [
        strategyAddresses[0],
        "100",
      ]),
      to: poolAccountants[0],
    });

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([
      createFinding(strategyAddresses[0], "100"),
    ]);
  });

  it("should returns multiple findings if reportLoss was called multiple times", async () => {
    handleTransaction = provideHandleTransaction(mockWeb3);

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        input: encodeFunctionCall(reportLossABI as any, [
          strategyAddresses[0],
          "100",
        ]),
        to: poolAccountants[0],
      })
      .addTraces({
        input: encodeFunctionCall(reportLossABI as any, [
          strategyAddresses[1],
          "150",
        ]),
        to: poolAccountants[0],
      });

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([
      createFinding(strategyAddresses[0], "100"),
      createFinding(strategyAddresses[1], "150"),
    ]);
  });

  it("should returns empty findings if reportLoss wasn't called in the correct contract", async () => {
    handleTransaction = provideHandleTransaction(mockWeb3);

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      input: encodeFunctionCall(reportLossABI as any, [
        strategyAddresses[0],
        "100",
      ]),
      to: createAddress("0x4"),
    });

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([]);
  });

  it("should returns finding if losses were reported through EarningReported event", async () => {
    handleTransaction = provideHandleTransaction(mockWeb3);

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      earningReportedSignature,
      poolAccountants[0],
      encodeParameters(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
        [0, 12, 13, 40, 20, 10]
      ),
      encodeParameter("address", strategyAddresses[0])
    );

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([createFinding(strategyAddresses[0], "12")]);
  });

  it("should returns empty finding if EarningReported doesn't report losses", async () => {
    handleTransaction = provideHandleTransaction(mockWeb3);

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      earningReportedSignature,
      poolAccountants[0],
      encodeParameters(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
        [1, 0, 13, 40, 20, 10]
      ),
      encodeParameter("address", strategyAddresses[0])
    );

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([]);
  });
});
