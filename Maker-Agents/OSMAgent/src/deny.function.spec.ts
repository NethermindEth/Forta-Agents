import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import provideDenyFunctionHandler from "./deny.function";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { DENY_FUNCTION_SIG } from "./utils";

const CONTRACTS: Map<string, string> = new Map<string, string>([
  ["PIP_ONE", createAddress("0xa1")],
  ["PIP_TWO", createAddress("0xa2")],
  ["PIP_THREE", createAddress("0xa3")],
]);

const ADDRESSES = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];
const denyIface = new utils.Interface([DENY_FUNCTION_SIG]);

export const createFinding = (to: string, address: string) => {
  return Finding.fromObject({
    name: "Maker OSM DENY Function",
    description: "DENY Function is called",
    alertId: "MakerDAO-OSM-2",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Maker",
    metadata: {
      contract: to,
      deniedAddress: address,
    },
  });
};

describe("OSM Rely Function Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = {
      osmContracts: CONTRACTS,
      getOsmAddresses: jest.fn(),
      updateAddresses: jest.fn(),
    };
    handleTransaction = provideDenyFunctionHandler(mockFetcher);
  });

  it("should return a finding for one of the OSM contracts", async () => {
    const _from = createAddress("0x2");
    const _to = CONTRACTS.get("PIP_ONE") as string;
    const _input: string = denyIface.encodeFunctionData("deny", [ADDRESSES[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setTimestamp(1).setTo(_to).addTraces({
      to: _to,
      from: _from,
      input: _input,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(_to, ADDRESSES[0])]);
  });

  it("should return multiple findings", async () => {
    const _from = createAddress("0x2");
    const _input: string = denyIface.encodeFunctionData("deny", [ADDRESSES[0]]);
    const _input2: string = denyIface.encodeFunctionData("deny", [ADDRESSES[1]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(2)
      .setTo(CONTRACTS.get("PIP_TWO") as string)
      .addTraces(
        {
          to: CONTRACTS.get("PIP_TWO") as string,
          from: _from,
          input: _input,
        },
        {
          to: CONTRACTS.get("PIP_TWO") as string,
          from: _from,
          input: _input2,
        }
      );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(CONTRACTS.get("PIP_TWO") as string, ADDRESSES[0]),
      createFinding(CONTRACTS.get("PIP_TWO") as string, ADDRESSES[1]),
    ]);
  });

  it("should return an empty finding when deny is called on a different contract", async () => {
    const _from = createAddress("0x2");
    const _to = createAddress("0x1"); // BAD ADDRESS
    const _input: string = denyIface.encodeFunctionData("deny", [ADDRESSES[2]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(3)
      .setTo(CONTRACTS.get("PIP_THREE") as string)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
