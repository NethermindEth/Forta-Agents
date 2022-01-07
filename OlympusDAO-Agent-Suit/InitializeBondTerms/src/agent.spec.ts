import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { 
  TestTransactionEvent, 
  createAddress,
} from "forta-agent-tools";
import { Interface, FunctionFragment } from "@ethersproject/abi";
import utils from "./utils";
import { resetAllWhenMocks, when } from "jest-when";

const IFACE = new Interface([
  ...utils.BONDS_ABI,
  "function myFunction(uint, uint, uint, uint, uint, uint, uint)"
]);
const initTerms: FunctionFragment = IFACE.getFunction("0x7b261727");
const initTermsWithFee: FunctionFragment = IFACE.getFunction("0x71535008");

const createFinding = (
  metadata: Record<string, string>, 
): Finding =>
  Finding.fromObject({
    name: 'OlympusDAO Bond function call detected',
    description: 'Call to initializeBondTerms',
    alertId: 'olympus-bond-4',
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: 'OlympusDAO',
    metadata,
  });

const BONDS: string[] = [
  createAddress("0xdef101"),
  createAddress("0xdef102"),
  createAddress("0xdef103"),
]

const PARAMS: [number, number, number, number, number, number, number][] = [
  [1, 2, 3, 4, 5, 6, 987],
  [2, 2, 3, 3, 4, 4, 654],
  [200, 15, 42, 31, 2000, 600, 321],
  [10, 20, 0, 90, 20, 1, 123],
  [6, 5, 4, 3, 2, 1, 456],
  [42, 50, 5, 12, 14, 15, 789],
];

describe("Bond - initializeBondTerms Agent test suite", () => {
  const mockFunction = jest.fn();
  const handler: HandleTransaction = provideHandleTransaction({
    getBondsContracts: mockFunction,
  } as any);

  const mockBlock = (block: number) => 
    when(mockFunction).calledWith(block).mockReturnValue(BONDS);

  beforeEach(() => resetAllWhenMocks());

  it("should return empty findings on txns without function call", async () => {
    mockBlock(10);
    const tx: TransactionEvent =  new TestTransactionEvent().setBlock(10);

    const finding: Finding[] = await handler(tx);
    expect(finding).toStrictEqual([]);
  });

  it("should return empty findings on txns calling other functions", async () => {
    mockBlock(1);
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(1)
      .addTraces({
        to: BONDS[0],
        input: IFACE.encodeFunctionData("myFunction", PARAMS[0]),
      });

    const finding: Finding[] = await handler(tx);
    expect(finding).toStrictEqual([]);
  });

  it("should return empty findings if the funcion is called in other contract", async () => {
    mockBlock(42);
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(42)
      .addTraces({
        to: createAddress("0xdead"),
        input: IFACE.encodeFunctionData(initTermsWithFee, PARAMS[0]),
      });

    const finding: Finding[] = await handler(tx);
    expect(finding).toStrictEqual([]);
  });

  it("should detect the calls in the bonds contracts", async () => {
    mockBlock(99);
    const tx: TestTransactionEvent =  new TestTransactionEvent().setBlock(99);

    const expectedFindings: Finding[] = [];

    for(let bond of BONDS) {
      for(let params of PARAMS) {
        const [
          _controlVariable, 
          _vestingTerm,
          _minimumPrice,
          _maxPayout,
          _fee,
          _maxDebt,
          _initialDebt,
        ] = params.map((val: number) => val.toString());
        const metadata = {
          _controlVariable, 
          _vestingTerm,
          _minimumPrice,
          _maxPayout,
          _maxDebt,
          _initialDebt,
          bond,
        };

        // add call to initializeBondTerms with _fee param
        tx.addTraces({
          to: bond,
          input: IFACE.encodeFunctionData(initTermsWithFee, params),
        });
        expectedFindings.push(createFinding({
          ...metadata,
          _fee,
        }));

        // add call to initializeBondTerms without _fee param
        const noFee = Object.assign([], params) // copy the params array
        noFee.splice(4, 1) // remove the _fee parameter 
        tx.addTraces({
          to: bond,
          input: IFACE.encodeFunctionData(initTerms, noFee),
        });
        expectedFindings.push(createFinding(metadata));
      }
    }

    const finding: Finding[] = await handler(tx);
    expect(finding).toStrictEqual(expectedFindings);
  });
});
