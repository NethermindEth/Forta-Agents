import { create } from "@mui/material/styles/createTransitions";
import { Interface } from "ethers/lib/utils";
import {
  Finding,
  FindingType,
  FindingSeverity,
  HandleTransaction,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { handleTransaction } from "./agent";
import NetworkManager from "./network";
import utils from "./utils";

const TEST_APEFACTORY_CONTRACT = createAddress("0x234a");
const OTHER_FUNCTION_IFACE: Interface = new Interface([
  "function otherFunction(address otherAddress)",
]);

const testCreateFinding = (
  call: string,
  address: string,
  contract: NetworkManager
): Finding => {
  if (call == "setFeeTo") {
    return Finding.fromObject({
      name: "ApeFactory FeeTo address changed",
      description: `${call} function called in ApeFactory contract.`,
      alertId: "APESWAP-7-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata: {
        feeTo: address.toLowerCase(),
      },
    });
  } else
    return Finding.fromObject({
      name: "ApeFactory FeeTo setter address changed",
      description: `${call} function called in ApeFactory contract.`,
      alertId: "APESWAP-7-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata: {
        feeToSetter: address.toLowerCase(),
      },
    });
};

const CASES: string[] = [
  createAddress("0xb423"),
  createAddress("0xbee1"),
  createAddress("0x5c3e"),
  createAddress("0x8b3e"),
  createAddress("0x27c1"),
  createAddress("0xacaa"),
  createAddress("0xbbc3"),
  createAddress("0xcdad"),
];

describe("Apeswap role changes bot test suite", () => {
  const mockNetworkManager: NetworkManager = {
    factory: TEST_APEFACTORY_CONTRACT,
    setNetwork: jest.fn(),
  };
  const handleTx: HandleTransaction = handleTransaction(
    mockNetworkManager as any
  );

  it("should ignore other function calls on ApeFactory contract", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addTraces({
      to: TEST_APEFACTORY_CONTRACT,
      from: createAddress("0x123a"),
      input: OTHER_FUNCTION_IFACE.encodeFunctionData("otherFunction", [
        CASES[0],
      ]), //other function
    });
    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("shoud ignore setFeeTo/setFeeToSetter function calls on other contracts", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addTraces({
      to: createAddress("0xba23"), //other contract
      from: createAddress("0x123b"),
      input: utils.FUNCTIONS_IFACE.encodeFunctionData("setFeeTo", [CASES[1]]),
    });

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should create finding for setFeeTo function call", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addTraces({
      to: mockNetworkManager.factory,
      from: createAddress("0x123c"),
      input: utils.FUNCTIONS_IFACE.encodeFunctionData("setFeeTo", [CASES[2]]),
    });

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("setFeeTo", CASES[2], mockNetworkManager),
    ]);
  });

  it("should create finding for setFeeToSetter function call", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent().addTraces({
      to: mockNetworkManager.factory,
      from: createAddress("0x123d"),
      input: utils.FUNCTIONS_IFACE.encodeFunctionData("setFeeToSetter", [
        CASES[3],
      ]),
    });

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("setFeeToSetter", CASES[3], mockNetworkManager),
    ]);
  });

  it("should return multiple findings correctly", async () => {
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: mockNetworkManager.factory,
        from: createAddress("0x123e"),
        input: utils.FUNCTIONS_IFACE.encodeFunctionData("setFeeTo", [CASES[4]]),
      })
      .addTraces({
        to: createAddress("0x5456"), //other contract
        from: createAddress("0x123f"),
        input: utils.FUNCTIONS_IFACE.encodeFunctionData("setFeeToSetter", [
          CASES[5],
        ]),
      })
      .addTraces({
        to: mockNetworkManager.factory,
        from: createAddress("0x1238"),
        input: OTHER_FUNCTION_IFACE.encodeFunctionData("otherFunction", [
          CASES[6],
        ]), //other function
      })
      .addTraces({
        to: mockNetworkManager.factory,
        from: createAddress("0x1238"),
        input: utils.FUNCTIONS_IFACE.encodeFunctionData("setFeeToSetter", [
          CASES[7],
        ]),
      });

    const findings: Finding[] = await handleTx(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("setFeeTo", CASES[4], mockNetworkManager),
      testCreateFinding("setFeeToSetter", CASES[7], mockNetworkManager),
    ]);
  });
});
