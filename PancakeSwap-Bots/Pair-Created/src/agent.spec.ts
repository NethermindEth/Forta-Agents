import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
  ethers,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import { utils } from "ethers";
import { getCreate2Address } from "@ethersproject/address";
import { provideHandleTransaction } from "./agent";
import { CREATE_PAIR_FUNCTION } from "./constants";

const MOCK_OTHER_FUNCTION: string =
  "function setFeeToSetter(address _feeToSetter)";
const MOCK_FACTORY: string = createAddress("0x9a9a");
const MOCK_INIT_CODE_HASH: string = keccak256(MOCK_FACTORY);
const MOCK_IFACE: ethers.utils.Interface = new ethers.utils.Interface([
  CREATE_PAIR_FUNCTION,
  MOCK_OTHER_FUNCTION,
]);

const TEST_CASES: string[] = [
  createAddress("0xaa1111"),
  createAddress("0xbb2222"),
  createAddress("0xcc3333"),
  createAddress("0xdd4444"),
  createAddress("0xee5555"),
  createAddress("0xff6666"),
  createAddress("0xaabb77"),
  createAddress("0xccdd88"),
];

const mockCreateFinding = (
  tokenA: string,
  tokenB: string,
  pair: string
): Finding => {
  return Finding.fromObject({
    name: "New pair creation on Pancakeswap's Factory contract",
    description: "New pair creation call detected on Factory contract",
    alertId: "CAKE-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Pancakeswap",
    metadata: {
      tokenA,
      tokenB,
      pair,
    },
  });
};

// generate new pair address
const mockCreatePair = (
  mockFactory: string,
  token0: string,
  token1: string
): string => {
  let salt: string = utils.solidityKeccak256(
    ["address", "address"],
    [token0, token1]
  );
  return getCreate2Address(
    mockFactory,
    salt,
    MOCK_INIT_CODE_HASH
  ).toLowerCase();
};

describe("Pair Created Test Suite", () => {
  let txEvent: TransactionEvent;
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      MOCK_FACTORY,
      CREATE_PAIR_FUNCTION,
      mockCreatePair
    );
  });

  let findings: Finding[];

  it("should return empty finding in empty transaction", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore non-createPair function call on Pancakeswap's Factory contract", async () => {
    txEvent = new TestTransactionEvent().addTraces({
      to: MOCK_FACTORY,
      input: MOCK_IFACE.encodeFunctionData("setFeeToSetter", [
        TEST_CASES[0], 
      ]),// different function - setFeeToSetter
    });

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
